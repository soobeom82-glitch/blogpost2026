import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { readStore, mutateStore } from "./file-store.js";
import { hashPassword, verifyPassword } from "./passwords.js";

const databaseUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const sql = databaseUrl
  ? postgres(databaseUrl, { prepare: false, max: 5, connect_timeout: 5, idle_timeout: 20 })
  : null;
let ready;
const DAY_MS = 86400000;

export function getKstDayWindow(dayOffset = 1, now = new Date()) {
  const shifted = new Date(now.getTime() + 9 * 3600000);
  const start = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      9 * 3600000 -
      dayOffset * DAY_MS,
  );
  const dateKey = new Date(start.getTime() + 9 * 3600000).toISOString().slice(0, 10);
  return {
    start,
    end: new Date(start.getTime() + DAY_MS),
    dateKey,
    label: dateKey.replaceAll("-", "."),
  };
}

async function ensureDatabase() {
  if (!ready) {
    ready = sql
      .begin(async (db) => {
        await db`SELECT pg_advisory_xact_lock(728491203)`;
        await db`CREATE TABLE IF NOT EXISTS post_stats (slug TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
        await db`CREATE TABLE IF NOT EXISTS post_comments (id TEXT PRIMARY KEY, slug TEXT NOT NULL, parent_id TEXT, nickname TEXT NOT NULL, password_hash TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ)`;
        await db`CREATE INDEX IF NOT EXISTS post_comments_slug_created_at_idx ON post_comments (slug, created_at)`;
        await db`CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON post_comments (parent_id)`;
        await db`CREATE TABLE IF NOT EXISTS post_view_events (id TEXT PRIMARY KEY, slug TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
        await db`CREATE INDEX IF NOT EXISTS post_view_events_created_at_idx ON post_view_events (created_at)`;
        await db`CREATE TABLE IF NOT EXISTS post_like_events (id TEXT PRIMARY KEY, slug TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
        await db`CREATE INDEX IF NOT EXISTS post_like_events_created_at_idx ON post_like_events (created_at)`;
        await db`CREATE TABLE IF NOT EXISTS post_likes (slug TEXT NOT NULL, actor TEXT NOT NULL, PRIMARY KEY (slug, actor))`;
        await db`CREATE TABLE IF NOT EXISTS post_view_receipts (slug TEXT NOT NULL, actor TEXT NOT NULL, day DATE NOT NULL, PRIMARY KEY (slug, actor, day))`;
        await db`CREATE TABLE IF NOT EXISTS api_rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL)`;
        await db`CREATE TABLE IF NOT EXISTS daily_report_logs (report_date DATE PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
        // Additive migration preserves existing counts, comments, and sent reports.
        await db`ALTER TABLE daily_report_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent'`;
        await db`ALTER TABLE daily_report_logs ADD COLUMN IF NOT EXISTS token TEXT`;
        await db`ALTER TABLE daily_report_logs ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ`;
      })
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  await ready;
}

function ensurePost(store, slug) {
  store.posts ||= {};
  store.events ||= { views: [], likes: [] };
  store.reports ||= {};
  store.posts[slug] ||= { views: 0, likes: 0, comments: [] };
  const post = store.posts[slug];
  post.likes ||= 0;
  post.likedBy ||= [];
  post.viewReceipts ||= {};
  return post;
}

function fileStats(post, actor) {
  return {
    views: post.views || 0,
    likeCount: post.likes || 0,
    commentCount: post.comments?.length || 0,
    ...(actor ? { liked: post.likedBy?.includes(actor) || false } : {}),
  };
}

async function dbStats(db, slug, actor) {
  const [row] = await db`SELECT views, likes FROM post_stats WHERE slug = ${slug}`;
  const [comments] =
    await db`SELECT COUNT(*)::int AS count FROM post_comments WHERE slug = ${slug}`;
  const likes = actor
    ? await db`SELECT 1 FROM post_likes WHERE slug = ${slug} AND actor = ${actor}`
    : [];
  return {
    views: row?.views || 0,
    likeCount: row?.likes || 0,
    commentCount: comments.count,
    ...(actor ? { liked: likes.length > 0 } : {}),
  };
}

async function lockPost(db, slug) {
  await db`INSERT INTO post_stats (slug) VALUES (${slug}) ON CONFLICT DO NOTHING`;
  await db`SELECT slug FROM post_stats WHERE slug = ${slug} FOR UPDATE`;
}

export async function getPostStats(slug, actor) {
  if (sql) {
    await ensureDatabase();
    return dbStats(sql, slug, actor);
  }
  return fileStats(ensurePost(await readStore(), slug), actor);
}

export async function getPostStatsMap(slugs) {
  if (!slugs.length) return {};
  if (!sql) {
    const store = await readStore();
    return Object.fromEntries(slugs.map((slug) => [slug, fileStats(ensurePost(store, slug))]));
  }
  await ensureDatabase();
  const stats = await sql`SELECT slug, views, likes FROM post_stats WHERE slug IN ${sql(slugs)}`;
  const counts =
    await sql`SELECT slug, COUNT(*)::int AS count FROM post_comments WHERE slug IN ${sql(slugs)} GROUP BY slug`;
  const result = Object.fromEntries(
    slugs.map((slug) => [slug, { views: 0, likeCount: 0, commentCount: 0 }]),
  );
  for (const row of stats)
    result[row.slug] = { ...result[row.slug], views: row.views, likeCount: row.likes };
  for (const row of counts) result[row.slug].commentCount = row.count;
  return result;
}

export async function incrementPostView(slug, actor) {
  const day = getKstDayWindow(0).dateKey;
  if (!sql)
    return mutateStore((store) => {
      const post = ensurePost(store, slug);
      const changed = post.viewReceipts[actor] !== day;
      for (const [key, date] of Object.entries(post.viewReceipts))
        if (date !== day) delete post.viewReceipts[key];
      if (changed) {
        post.viewReceipts[actor] = day;
        post.views++;
        store.events.views.push({ id: randomUUID(), slug, createdAt: new Date().toISOString() });
      }
      return { ...fileStats(post, actor), changed };
    });
  await ensureDatabase();
  return sql.begin(async (db) => {
    await lockPost(db, slug);
    await db`DELETE FROM post_view_receipts WHERE slug = ${slug} AND day < ${day}`;
    const added =
      await db`INSERT INTO post_view_receipts (slug, actor, day) VALUES (${slug}, ${actor}, ${day}) ON CONFLICT DO NOTHING RETURNING actor`;
    if (added.length) {
      await db`UPDATE post_stats SET views = views + 1, updated_at = NOW() WHERE slug = ${slug}`;
      await db`INSERT INTO post_view_events (id, slug) VALUES (${randomUUID()}, ${slug})`;
    }
    return { ...(await dbStats(db, slug, actor)), changed: added.length > 0 };
  });
}

export async function setPostLike(slug, liked, actor) {
  if (!sql)
    return mutateStore((store) => {
      const post = ensurePost(store, slug);
      const wasLiked = post.likedBy.includes(actor);
      if (wasLiked !== liked) {
        post.likedBy = liked ? [...post.likedBy, actor] : post.likedBy.filter((id) => id !== actor);
        post.likes = Math.max(0, post.likes + (liked ? 1 : -1));
        if (liked)
          store.events.likes.push({ id: randomUUID(), slug, createdAt: new Date().toISOString() });
      }
      return { ...fileStats(post, actor), changed: wasLiked !== liked };
    });
  await ensureDatabase();
  return sql.begin(async (db) => {
    await lockPost(db, slug);
    const changed = liked
      ? await db`INSERT INTO post_likes (slug, actor) VALUES (${slug}, ${actor}) ON CONFLICT DO NOTHING RETURNING actor`
      : await db`DELETE FROM post_likes WHERE slug = ${slug} AND actor = ${actor} RETURNING actor`;
    if (changed.length) {
      await db`UPDATE post_stats SET likes = GREATEST(0, likes + ${liked ? 1 : -1}), updated_at = NOW() WHERE slug = ${slug}`;
      if (liked)
        await db`INSERT INTO post_like_events (id, slug) VALUES (${randomUUID()}, ${slug})`;
    }
    return { ...(await dbStats(db, slug, actor)), changed: changed.length > 0 };
  });
}

function commentTree(rows) {
  const items = rows.map(({ passwordHash: _passwordHash, ...row }) => ({ ...row, replies: [] }));
  const byId = new Map(items.map((item) => [item.id, item]));
  const roots = [];
  for (const item of items) {
    if (item.parentId && byId.has(item.parentId)) byId.get(item.parentId).replies.push(item);
    else roots.push(item);
  }
  return roots;
}

async function dbCommentRows(db, slug) {
  return db`SELECT id, parent_id AS "parentId", nickname, content, password_hash AS "passwordHash", created_at AS "createdAt", updated_at AS "updatedAt" FROM post_comments WHERE slug = ${slug} ORDER BY created_at, id`;
}

export async function getPostComments(slug) {
  if (sql) {
    await ensureDatabase();
    return commentTree(await dbCommentRows(sql, slug));
  }
  return commentTree(ensurePost(await readStore(), slug).comments);
}

function validParent(rows, parentId) {
  if (!parentId) return true;
  const byId = new Map(rows.map((row) => [row.id, row]));
  let current = byId.get(parentId);
  if (!current) return false;
  let depth = 0;
  while (current) {
    if (++depth > 5) return false;
    current = byId.get(current.parentId);
  }
  return true;
}

async function changeComment(slug, operation, payload) {
  const newHash =
    operation === "create" || operation === "update" ? await hashPassword(payload.password) : null;
  async function mutate(rows) {
    if (operation === "create") {
      if (!validParent(rows, payload.parentId)) return { error: "invalid_parent" };
      rows.push({
        id: randomUUID(),
        parentId: payload.parentId || null,
        nickname: payload.nickname,
        passwordHash: newHash,
        content: payload.content,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      return { rows };
    }
    const comment = rows.find((row) => row.id === payload.commentId);
    if (!comment) return { error: "not_found" };
    if (
      operation !== "admin-delete" &&
      !(await verifyPassword(payload.password, comment.passwordHash))
    )
      return { error: "invalid_password" };
    if (operation === "update") {
      Object.assign(comment, {
        content: payload.content,
        passwordHash: newHash,
        updatedAt: new Date().toISOString(),
      });
      return { rows };
    }
    const ids = new Set([comment.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of rows)
        if (ids.has(row.parentId) && !ids.has(row.id)) {
          ids.add(row.id);
          changed = true;
        }
    }
    return { rows: rows.filter((row) => !ids.has(row.id)), deletedIds: [...ids] };
  }
  if (!sql)
    return mutateStore(async (store) => {
      const post = ensurePost(store, slug);
      const result = await mutate(post.comments);
      if (result.error) return result;
      post.comments = result.rows;
      return { stats: fileStats(post), comments: commentTree(post.comments) };
    });
  await ensureDatabase();
  return sql.begin(async (db) => {
    await lockPost(db, slug);
    const result = await mutate(await dbCommentRows(db, slug));
    if (result.error) return result;
    if (operation === "create") {
      const row = result.rows.at(-1);
      await db`INSERT INTO post_comments (id, slug, parent_id, nickname, password_hash, content) VALUES (${row.id}, ${slug}, ${row.parentId}, ${row.nickname}, ${row.passwordHash}, ${row.content})`;
    } else if (operation === "update") {
      await db`UPDATE post_comments SET content = ${payload.content}, password_hash = ${newHash}, updated_at = NOW() WHERE slug = ${slug} AND id = ${payload.commentId}`;
    } else {
      await db`DELETE FROM post_comments WHERE slug = ${slug} AND id IN ${db(result.deletedIds)}`;
    }
    return { stats: await dbStats(db, slug), comments: commentTree(await dbCommentRows(db, slug)) };
  });
}

export const createPostComment = (slug, payload) => changeComment(slug, "create", payload);
export const updatePostComment = (slug, payload) => changeComment(slug, "update", payload);
export const deletePostComment = (slug, payload) => changeComment(slug, "delete", payload);
export const deletePostCommentAsAdmin = (slug, payload) =>
  changeComment(slug, "admin-delete", payload);

export async function consumeRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const expiresAt = new Date(now + windowMs);
  if (!sql)
    return mutateStore((store) => {
      store.rateLimits ||= {};
      for (const [id, bucket] of Object.entries(store.rateLimits))
        if (bucket.expiresAt <= now) delete store.rateLimits[id];
      store.rateLimits[key] ||= { count: 0, expiresAt: expiresAt.getTime() };
      const bucket = store.rateLimits[key];
      bucket.count++;
      return {
        allowed: bucket.count <= limit,
        retryAfter: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000)),
      };
    });
  await ensureDatabase();
  await sql`DELETE FROM api_rate_limits WHERE expires_at < NOW()`;
  const [bucket] =
    await sql`INSERT INTO api_rate_limits (key, count, expires_at) VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE SET count = CASE WHEN api_rate_limits.expires_at <= NOW() THEN 1 ELSE api_rate_limits.count + 1 END,
    expires_at = CASE WHEN api_rate_limits.expires_at <= NOW() THEN EXCLUDED.expires_at ELSE api_rate_limits.expires_at END
    RETURNING count, expires_at`;
  return {
    allowed: bucket.count <= limit,
    retryAfter: Math.max(1, Math.ceil((new Date(bucket.expires_at).getTime() - now) / 1000)),
  };
}

export async function getDailyReportSummary(dayOffset = 1) {
  const { start, end, dateKey, label } = getKstDayWindow(dayOffset);
  let visits, likes, comments;
  if (sql) {
    await ensureDatabase();
    visits =
      await sql`SELECT slug, COUNT(*)::int AS count FROM post_view_events WHERE created_at >= ${start} AND created_at < ${end} GROUP BY slug`;
    likes =
      await sql`SELECT slug, COUNT(*)::int AS count FROM post_like_events WHERE created_at >= ${start} AND created_at < ${end} GROUP BY slug`;
    comments =
      await sql`SELECT slug, COUNT(*)::int AS count FROM post_comments WHERE created_at >= ${start} AND created_at < ${end} GROUP BY slug`;
  } else {
    const store = await readStore();
    function count(events) {
      const counts = new Map();
      for (const event of events)
        if (new Date(event.createdAt) >= start && new Date(event.createdAt) < end)
          counts.set(event.slug, (counts.get(event.slug) || 0) + 1);
      return [...counts].map(([slug, count]) => ({ slug, count }));
    }
    visits = count(store.events?.views || []);
    likes = count(store.events?.likes || []);
    comments = count(
      Object.entries(store.posts || {}).flatMap(([slug, post]) =>
        post.comments.map((comment) => ({ ...comment, slug })),
      ),
    );
  }
  const bySlug = new Map();
  const totals = { visits: 0, likes: 0, comments: 0 };
  for (const [type, rows] of [
    ["visits", visits],
    ["likes", likes],
    ["comments", comments],
  ])
    for (const row of rows) {
      const post = bySlug.get(row.slug) || { slug: row.slug, visits: 0, likes: 0, comments: 0 };
      post[type] = row.count;
      totals[type] += row.count;
      bySlug.set(row.slug, post);
    }
  const score = (post) => post.visits + post.likes * 3 + post.comments * 5;
  return {
    dateKey,
    label,
    totals,
    posts: [...bySlug.values()].sort((a, b) => score(b) - score(a) || a.slug.localeCompare(b.slug)),
  };
}

export async function claimDailyReportDelivery(dateKey) {
  const token = randomUUID();
  const leaseUntil = new Date(Date.now() + 5 * 60000);
  if (!sql)
    return mutateStore((store) => {
      store.reports ||= {};
      const previous = store.reports[dateKey];
      if (previous && (previous.sentAt || new Date(previous.leaseUntil) > new Date())) return null;
      store.reports[dateKey] = { token, leaseUntil: leaseUntil.toISOString() };
      return token;
    });
  await ensureDatabase();
  const rows =
    await sql`INSERT INTO daily_report_logs (report_date, status, token, lease_until) VALUES (${dateKey}, 'sending', ${token}, ${leaseUntil})
    ON CONFLICT (report_date) DO UPDATE SET status = 'sending', token = EXCLUDED.token, lease_until = EXCLUDED.lease_until
    WHERE daily_report_logs.status = 'sending' AND daily_report_logs.lease_until < NOW() RETURNING token`;
  return rows[0]?.token || null;
}

export async function completeDailyReportDelivery(dateKey, token) {
  if (!sql)
    return mutateStore((store) => {
      if (store.reports?.[dateKey]?.token === token)
        store.reports[dateKey] = { sentAt: new Date().toISOString() };
    });
  await ensureDatabase();
  await sql`UPDATE daily_report_logs SET status = 'sent', sent_at = NOW(), token = NULL, lease_until = NULL WHERE report_date = ${dateKey} AND token = ${token}`;
}

export async function releaseDailyReportDelivery(dateKey, token) {
  if (!sql)
    return mutateStore((store) => {
      if (store.reports?.[dateKey]?.token === token) delete store.reports[dateKey];
    });
  await ensureDatabase();
  await sql`DELETE FROM daily_report_logs WHERE report_date = ${dateKey} AND status = 'sending' AND token = ${token}`;
}

export async function closeDatabase() {
  if (sql) await sql.end();
}
