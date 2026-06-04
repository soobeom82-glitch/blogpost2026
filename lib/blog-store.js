import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

const STORE_PATH = path.join(process.cwd(), "data", "blog-store.json");
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  null;
const hasDatabase = Boolean(databaseUrl);

const sql = hasDatabase
  ? postgres(databaseUrl, {
      prepare: false
    })
  : null;

let dbReadyPromise = null;

function createEmptyStore() {
  return {
    posts: {},
    events: {
      views: [],
      likes: []
    },
    reports: {}
  };
}

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return createEmptyStore();
    }

    throw error;
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function ensurePost(store, slug) {
  if (!store.events) {
    store.events = {
      views: [],
      likes: []
    };
  }

  if (!store.reports) {
    store.reports = {};
  }

  if (!store.posts[slug]) {
    store.posts[slug] = {
      views: 0,
      likes: 0,
      comments: []
    };
  }

  if (typeof store.posts[slug].likes !== "number") {
    store.posts[slug].likes = 0;
  }

  return store.posts[slug];
}

function countComments(comments) {
  return comments.length;
}

function buildCommentTree(comments) {
  const items = comments.map((comment) => ({
    ...comment,
    replies: []
  }));

  const byId = new Map(items.map((comment) => [comment.id, comment]));
  const roots = [];

  for (const comment of items) {
    if (comment.parentId) {
      const parent = byId.get(comment.parentId);

      if (parent) {
        parent.replies.push(comment);
        continue;
      }
    }

    roots.push(comment);
  }

  return roots;
}

function sanitizeCommentTree(comments) {
  return comments.map(({ passwordHash, replies, ...comment }) => ({
    ...comment,
    replies: sanitizeCommentTree(replies)
  }));
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function findCommentIndex(comments, commentId) {
  return comments.findIndex((comment) => comment.id === commentId);
}

function getKstDayWindow(dayOffset = 1, now = new Date()) {
  const shiftedNow = new Date(now.getTime() + KST_OFFSET_MS);
  const year = shiftedNow.getUTCFullYear();
  const month = shiftedNow.getUTCMonth();
  const date = shiftedNow.getUTCDate();
  const todayStartUtcMs =
    Date.UTC(year, month, date, 0, 0, 0, 0) - KST_OFFSET_MS;
  const startUtcMs = todayStartUtcMs - dayOffset * DAY_MS;
  const endUtcMs = startUtcMs + DAY_MS;
  const shiftedTarget = new Date(startUtcMs + KST_OFFSET_MS);
  const targetYear = shiftedTarget.getUTCFullYear();
  const targetMonth = String(shiftedTarget.getUTCMonth() + 1).padStart(2, "0");
  const targetDate = String(shiftedTarget.getUTCDate()).padStart(2, "0");

  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
    dateKey: `${targetYear}-${targetMonth}-${targetDate}`,
    label: `${targetYear}.${targetMonth}.${targetDate}`
  };
}

function summarizeCountsBySlug(events, start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const counts = new Map();

  for (const event of events) {
    const createdAtMs = new Date(event.createdAt).getTime();

    if (createdAtMs >= startMs && createdAtMs < endMs) {
      counts.set(event.slug, (counts.get(event.slug) ?? 0) + 1);
    }
  }

  return counts;
}

async function ensureDatabase() {
  if (!sql) {
    return false;
  }

  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS post_stats (
          slug TEXT PRIMARY KEY,
          views INTEGER NOT NULL DEFAULT 0,
          likes INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS post_comments (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL,
          parent_id TEXT NULL,
          nickname TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_comments_slug_created_at_idx
          ON post_comments (slug, created_at)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx
          ON post_comments (parent_id)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS post_view_events (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_view_events_created_at_idx
          ON post_view_events (created_at)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_view_events_slug_created_at_idx
          ON post_view_events (slug, created_at)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS post_like_events (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_like_events_created_at_idx
          ON post_like_events (created_at)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS post_like_events_slug_created_at_idx
          ON post_like_events (slug, created_at)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS daily_report_logs (
          report_date DATE PRIMARY KEY,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      return true;
    })();
  }

  return dbReadyPromise;
}

async function getCommentCountFromDb(slug) {
  await ensureDatabase();

  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM post_comments
    WHERE slug = ${slug}
  `;

  return rows[0]?.count ?? 0;
}

async function getPostCommentsFromDb(slug) {
  await ensureDatabase();

  const rows = await sql`
    SELECT
      id,
      parent_id AS "parentId",
      nickname,
      content,
      password_hash AS "passwordHash",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM post_comments
    WHERE slug = ${slug}
    ORDER BY created_at ASC
  `;

  return sanitizeCommentTree(buildCommentTree(rows));
}

async function getPostStatsFromDb(slug) {
  await ensureDatabase();

  const statRows = await sql`
    SELECT views, likes
    FROM post_stats
    WHERE slug = ${slug}
  `;

  const commentCount = await getCommentCountFromDb(slug);

  return {
    views: statRows[0]?.views ?? 0,
    likeCount: statRows[0]?.likes ?? 0,
    commentCount
  };
}

async function getPostStatsMapFromDb(slugs) {
  await ensureDatabase();

  const uniqueSlugs = [...new Set(slugs)];

  if (!uniqueSlugs.length) {
    return {};
  }

  const statRows = await sql`
    SELECT slug, views, likes
    FROM post_stats
    WHERE slug IN ${sql(uniqueSlugs)}
  `;

  const commentRows = await sql`
    SELECT slug, COUNT(*)::int AS count
    FROM post_comments
    WHERE slug IN ${sql(uniqueSlugs)}
    GROUP BY slug
  `;

  const statsBySlug = new Map(
    statRows.map((row) => [
      row.slug,
      {
        views: row.views ?? 0,
        likeCount: row.likes ?? 0,
        commentCount: 0
      }
    ])
  );

  for (const row of commentRows) {
    const current = statsBySlug.get(row.slug) ?? {
      views: 0,
      likeCount: 0,
      commentCount: 0
    };

    statsBySlug.set(row.slug, {
      ...current,
      commentCount: row.count ?? 0
    });
  }

  return Object.fromEntries(
    uniqueSlugs.map((slug) => [
      slug,
      statsBySlug.get(slug) ?? {
        views: 0,
        likeCount: 0,
        commentCount: 0
      }
    ])
  );
}

async function incrementPostViewInDb(slug) {
  await ensureDatabase();

  await sql`
    INSERT INTO post_stats (slug, views, likes, updated_at)
    VALUES (${slug}, 0, 0, NOW())
    ON CONFLICT (slug) DO NOTHING
  `;

  const rows = await sql`
    UPDATE post_stats
    SET views = views + 1, updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING views, likes
  `;

  await sql`
    INSERT INTO post_view_events (id, slug)
    VALUES (${randomUUID()}, ${slug})
  `;

  return {
    views: rows[0].views,
    likeCount: rows[0].likes,
    commentCount: await getCommentCountFromDb(slug)
  };
}

async function setPostLikeInDb(slug, liked) {
  await ensureDatabase();

  await sql`
    INSERT INTO post_stats (slug, views, likes, updated_at)
    VALUES (${slug}, 0, 0, NOW())
    ON CONFLICT (slug) DO NOTHING
  `;

  const rows = liked
    ? await sql`
        UPDATE post_stats
        SET likes = likes + 1, updated_at = NOW()
        WHERE slug = ${slug}
        RETURNING views, likes
      `
    : await sql`
        UPDATE post_stats
        SET likes = GREATEST(0, likes - 1), updated_at = NOW()
        WHERE slug = ${slug}
        RETURNING views, likes
      `;

  if (liked) {
    await sql`
      INSERT INTO post_like_events (id, slug)
      VALUES (${randomUUID()}, ${slug})
    `;
  }

  return {
    views: rows[0].views,
    likeCount: rows[0].likes,
    commentCount: await getCommentCountFromDb(slug)
  };
}

async function createPostCommentInDb(
  slug,
  { nickname, password, content, parentId = null }
) {
  await ensureDatabase();

  await sql`
    INSERT INTO post_comments (
      id,
      slug,
      parent_id,
      nickname,
      password_hash,
      content
    )
    VALUES (
      ${randomUUID()},
      ${slug},
      ${parentId},
      ${nickname},
      ${hashPassword(password)},
      ${content}
    )
  `;

  return {
    stats: await getPostStatsFromDb(slug),
    comments: await getPostCommentsFromDb(slug)
  };
}

async function updatePostCommentInDb(slug, { commentId, password, content }) {
  await ensureDatabase();

  const rows = await sql`
    SELECT id, password_hash AS "passwordHash"
    FROM post_comments
    WHERE slug = ${slug} AND id = ${commentId}
  `;

  if (!rows.length) {
    return { error: "not_found" };
  }

  if (rows[0].passwordHash !== hashPassword(password)) {
    return { error: "invalid_password" };
  }

  await sql`
    UPDATE post_comments
    SET content = ${content}, updated_at = NOW()
    WHERE slug = ${slug} AND id = ${commentId}
  `;

  return {
    stats: await getPostStatsFromDb(slug),
    comments: await getPostCommentsFromDb(slug)
  };
}

async function deletePostCommentInDb(slug, { commentId, password }) {
  await ensureDatabase();

  const rows = await sql`
    SELECT id, password_hash AS "passwordHash"
    FROM post_comments
    WHERE slug = ${slug} AND id = ${commentId}
  `;

  if (!rows.length) {
    return { error: "not_found" };
  }

  if (rows[0].passwordHash !== hashPassword(password)) {
    return { error: "invalid_password" };
  }

  await sql`
    WITH RECURSIVE comment_tree AS (
      SELECT id
      FROM post_comments
      WHERE slug = ${slug} AND id = ${commentId}
      UNION ALL
      SELECT child.id
      FROM post_comments child
      INNER JOIN comment_tree parent_tree
        ON child.parent_id = parent_tree.id
      WHERE child.slug = ${slug}
    )
    DELETE FROM post_comments
    WHERE id IN (SELECT id FROM comment_tree)
  `;

  return {
    stats: await getPostStatsFromDb(slug),
    comments: await getPostCommentsFromDb(slug)
  };
}

async function deletePostCommentInDbAsAdmin(slug, { commentId }) {
  await ensureDatabase();

  const rows = await sql`
    SELECT id
    FROM post_comments
    WHERE slug = ${slug} AND id = ${commentId}
  `;

  if (!rows.length) {
    return { error: "not_found" };
  }

  await sql`
    WITH RECURSIVE comment_tree AS (
      SELECT id
      FROM post_comments
      WHERE slug = ${slug} AND id = ${commentId}
      UNION ALL
      SELECT child.id
      FROM post_comments child
      INNER JOIN comment_tree parent_tree
        ON child.parent_id = parent_tree.id
      WHERE child.slug = ${slug}
    )
    DELETE FROM post_comments
    WHERE id IN (SELECT id FROM comment_tree)
  `;

  return {
    stats: await getPostStatsFromDb(slug),
    comments: await getPostCommentsFromDb(slug)
  };
}

async function getPostStatsFromFile(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  return {
    views: post.views,
    likeCount: post.likes,
    commentCount: countComments(post.comments)
  };
}

async function getPostStatsMapFromFile(slugs) {
  const store = await readStore();

  return Object.fromEntries(
    slugs.map((slug) => {
      const post = ensurePost(store, slug);

      return [
        slug,
        {
          views: post.views,
          likeCount: post.likes,
          commentCount: countComments(post.comments)
        }
      ];
    })
  );
}

async function incrementPostViewInFile(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  post.views += 1;
  store.events.views.push({
    id: randomUUID(),
    slug,
    createdAt: new Date().toISOString()
  });

  await writeStore(store);

  return {
    views: post.views,
    likeCount: post.likes,
    commentCount: countComments(post.comments)
  };
}

async function setPostLikeInFile(slug, liked) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  if (liked) {
    post.likes += 1;
    store.events.likes.push({
      id: randomUUID(),
      slug,
      createdAt: new Date().toISOString()
    });
  } else {
    post.likes = Math.max(0, post.likes - 1);
  }

  await writeStore(store);

  return {
    views: post.views,
    likeCount: post.likes,
    commentCount: countComments(post.comments)
  };
}

async function getPostCommentsFromFile(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  return sanitizeCommentTree(buildCommentTree(post.comments));
}

async function createPostCommentInFile(
  slug,
  { nickname, password, content, parentId = null }
) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  const comment = {
    id: randomUUID(),
    parentId,
    nickname,
    passwordHash: hashPassword(password),
    content,
    createdAt: new Date().toISOString()
  };

  post.comments.push(comment);

  await writeStore(store);

  return {
    stats: {
      views: post.views,
      likeCount: post.likes,
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

async function updatePostCommentInFile(slug, { commentId, password, content }) {
  const store = await readStore();
  const post = ensurePost(store, slug);
  const commentIndex = findCommentIndex(post.comments, commentId);

  if (commentIndex === -1) {
    return { error: "not_found" };
  }

  const comment = post.comments[commentIndex];

  if (comment.passwordHash !== hashPassword(password)) {
    return { error: "invalid_password" };
  }

  post.comments[commentIndex] = {
    ...comment,
    content,
    updatedAt: new Date().toISOString()
  };

  await writeStore(store);

  return {
    stats: {
      views: post.views,
      likeCount: post.likes,
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

async function deletePostCommentInFile(slug, { commentId, password }) {
  const store = await readStore();
  const post = ensurePost(store, slug);
  const commentIndex = findCommentIndex(post.comments, commentId);

  if (commentIndex === -1) {
    return { error: "not_found" };
  }

  const comment = post.comments[commentIndex];

  if (comment.passwordHash !== hashPassword(password)) {
    return { error: "invalid_password" };
  }

  const commentIdsToDelete = new Set([commentId]);

  let added = true;
  while (added) {
    added = false;

    for (const item of post.comments) {
      if (item.parentId && commentIdsToDelete.has(item.parentId)) {
        if (!commentIdsToDelete.has(item.id)) {
          commentIdsToDelete.add(item.id);
          added = true;
        }
      }
    }
  }

  post.comments = post.comments.filter(
    (item) => !commentIdsToDelete.has(item.id)
  );

  await writeStore(store);

  return {
    stats: {
      views: post.views,
      likeCount: post.likes,
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

async function deletePostCommentInFileAsAdmin(slug, { commentId }) {
  const store = await readStore();
  const post = ensurePost(store, slug);
  const commentIndex = findCommentIndex(post.comments, commentId);

  if (commentIndex === -1) {
    return { error: "not_found" };
  }

  const commentIdsToDelete = new Set([commentId]);

  let added = true;
  while (added) {
    added = false;

    for (const item of post.comments) {
      if (item.parentId && commentIdsToDelete.has(item.parentId)) {
        if (!commentIdsToDelete.has(item.id)) {
          commentIdsToDelete.add(item.id);
          added = true;
        }
      }
    }
  }

  post.comments = post.comments.filter(
    (item) => !commentIdsToDelete.has(item.id)
  );

  await writeStore(store);

  return {
    stats: {
      views: post.views,
      likeCount: post.likes,
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

async function getDailyReportSummaryFromDb(dayOffset = 1) {
  await ensureDatabase();

  const { start, end, dateKey, label } = getKstDayWindow(dayOffset);
  const visitRows = await sql`
    SELECT slug, COUNT(*)::int AS count
    FROM post_view_events
    WHERE created_at >= ${start.toISOString()} AND created_at < ${end.toISOString()}
    GROUP BY slug
  `;
  const likeRows = await sql`
    SELECT slug, COUNT(*)::int AS count
    FROM post_like_events
    WHERE created_at >= ${start.toISOString()} AND created_at < ${end.toISOString()}
    GROUP BY slug
  `;
  const commentRows = await sql`
    SELECT slug, COUNT(*)::int AS count
    FROM post_comments
    WHERE created_at >= ${start.toISOString()} AND created_at < ${end.toISOString()}
    GROUP BY slug
  `;

  const bySlug = new Map();

  for (const row of visitRows) {
    bySlug.set(row.slug, {
      slug: row.slug,
      visits: row.count ?? 0,
      likes: 0,
      comments: 0
    });
  }

  for (const row of likeRows) {
    const current = bySlug.get(row.slug) ?? {
      slug: row.slug,
      visits: 0,
      likes: 0,
      comments: 0
    };

    bySlug.set(row.slug, {
      ...current,
      likes: row.count ?? 0
    });
  }

  for (const row of commentRows) {
    const current = bySlug.get(row.slug) ?? {
      slug: row.slug,
      visits: 0,
      likes: 0,
      comments: 0
    };

    bySlug.set(row.slug, {
      ...current,
      comments: row.count ?? 0
    });
  }

  const posts = [...bySlug.values()].sort((left, right) => {
    const rightScore = right.visits + right.likes * 3 + right.comments * 5;
    const leftScore = left.visits + left.likes * 3 + left.comments * 5;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    if (right.visits !== left.visits) {
      return right.visits - left.visits;
    }

    return right.likes + right.comments - (left.likes + left.comments);
  });

  return {
    dateKey,
    label,
    totals: {
      visits: visitRows.reduce((sum, row) => sum + (row.count ?? 0), 0),
      likes: likeRows.reduce((sum, row) => sum + (row.count ?? 0), 0),
      comments: commentRows.reduce((sum, row) => sum + (row.count ?? 0), 0)
    },
    posts
  };
}

async function getDailyReportSummaryFromFile(dayOffset = 1) {
  const store = await readStore();
  const { start, end, dateKey, label } = getKstDayWindow(dayOffset);
  const visitCounts = summarizeCountsBySlug(store.events?.views ?? [], start, end);
  const likeCounts = summarizeCountsBySlug(store.events?.likes ?? [], start, end);
  const commentCounts = new Map();

  for (const [slug, post] of Object.entries(store.posts ?? {})) {
    for (const comment of post.comments ?? []) {
      const createdAtMs = new Date(comment.createdAt).getTime();

      if (createdAtMs >= start.getTime() && createdAtMs < end.getTime()) {
        commentCounts.set(slug, (commentCounts.get(slug) ?? 0) + 1);
      }
    }
  }

  const slugs = new Set([
    ...visitCounts.keys(),
    ...likeCounts.keys(),
    ...commentCounts.keys()
  ]);

  const posts = [...slugs]
    .map((slug) => ({
      slug,
      visits: visitCounts.get(slug) ?? 0,
      likes: likeCounts.get(slug) ?? 0,
      comments: commentCounts.get(slug) ?? 0
    }))
    .sort((left, right) => {
      const rightScore = right.visits + right.likes * 3 + right.comments * 5;
      const leftScore = left.visits + left.likes * 3 + left.comments * 5;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.visits - left.visits;
    });

  return {
    dateKey,
    label,
    totals: {
      visits: [...visitCounts.values()].reduce((sum, value) => sum + value, 0),
      likes: [...likeCounts.values()].reduce((sum, value) => sum + value, 0),
      comments: [...commentCounts.values()].reduce((sum, value) => sum + value, 0)
    },
    posts
  };
}

async function claimDailyReportDeliveryInDb(reportDate) {
  await ensureDatabase();

  const rows = await sql`
    INSERT INTO daily_report_logs (report_date)
    VALUES (${reportDate})
    ON CONFLICT (report_date) DO NOTHING
    RETURNING report_date
  `;

  return rows.length > 0;
}

async function claimDailyReportDeliveryInFile(reportDate) {
  const store = await readStore();

  if (store.reports?.[reportDate]) {
    return false;
  }

  if (!store.reports) {
    store.reports = {};
  }

  store.reports[reportDate] = {
    sentAt: new Date().toISOString()
  };

  await writeStore(store);
  return true;
}

async function releaseDailyReportDeliveryInDb(reportDate) {
  await ensureDatabase();

  await sql`
    DELETE FROM daily_report_logs
    WHERE report_date = ${reportDate}
  `;
}

async function releaseDailyReportDeliveryInFile(reportDate) {
  const store = await readStore();

  if (store.reports?.[reportDate]) {
    delete store.reports[reportDate];
    await writeStore(store);
  }
}

export async function getPostStats(slug) {
  if (hasDatabase) {
    return getPostStatsFromDb(slug);
  }

  return getPostStatsFromFile(slug);
}

export async function getPostStatsMap(slugs) {
  if (hasDatabase) {
    return getPostStatsMapFromDb(slugs);
  }

  return getPostStatsMapFromFile(slugs);
}

export async function incrementPostView(slug) {
  if (hasDatabase) {
    return incrementPostViewInDb(slug);
  }

  return incrementPostViewInFile(slug);
}

export async function setPostLike(slug, liked) {
  if (hasDatabase) {
    return setPostLikeInDb(slug, liked);
  }

  return setPostLikeInFile(slug, liked);
}

export async function getPostComments(slug) {
  if (hasDatabase) {
    return getPostCommentsFromDb(slug);
  }

  return getPostCommentsFromFile(slug);
}

export async function createPostComment(slug, payload) {
  if (hasDatabase) {
    return createPostCommentInDb(slug, payload);
  }

  return createPostCommentInFile(slug, payload);
}

export async function updatePostComment(slug, payload) {
  if (hasDatabase) {
    return updatePostCommentInDb(slug, payload);
  }

  return updatePostCommentInFile(slug, payload);
}

export async function deletePostComment(slug, payload) {
  if (hasDatabase) {
    return deletePostCommentInDb(slug, payload);
  }

  return deletePostCommentInFile(slug, payload);
}

export async function deletePostCommentAsAdmin(slug, payload) {
  if (hasDatabase) {
    return deletePostCommentInDbAsAdmin(slug, payload);
  }

  return deletePostCommentInFileAsAdmin(slug, payload);
}

export async function getDailyReportSummary(dayOffset = 1) {
  if (hasDatabase) {
    return getDailyReportSummaryFromDb(dayOffset);
  }

  return getDailyReportSummaryFromFile(dayOffset);
}

export async function claimDailyReportDelivery(reportDate) {
  if (hasDatabase) {
    return claimDailyReportDeliveryInDb(reportDate);
  }

  return claimDailyReportDeliveryInFile(reportDate);
}

export async function releaseDailyReportDelivery(reportDate) {
  if (hasDatabase) {
    return releaseDailyReportDeliveryInDb(reportDate);
  }

  return releaseDailyReportDeliveryInFile(reportDate);
}
