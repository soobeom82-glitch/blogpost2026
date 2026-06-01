import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

const STORE_PATH = path.join(process.cwd(), "data", "blog-store.json");
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
  return { posts: {} };
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
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await getPostStatsFromDb(slug)])
  );

  return Object.fromEntries(entries);
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
