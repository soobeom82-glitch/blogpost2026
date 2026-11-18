import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

const useDb = process.env.STORE_TEST_BACKEND === "postgres";
if (useDb && !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test"))
  throw new Error("Only a dedicated database ending in _test can be used.");
process.env.DATABASE_URL = useDb ? process.env.TEST_DATABASE_URL : "";
process.env.POSTGRES_URL = "";
process.env.POSTGRES_PRISMA_URL = "";
delete process.env.VERCEL;
const folder = await mkdtemp(join(tmpdir(), "blog-store-test-"));
process.env.BLOG_STORE_PATH = join(folder, "store.json");
const store = await import("../lib/blog-store.js");
const { hashPassword, verifyPassword } = await import("../lib/passwords.js");
const prefix = `test-${randomUUID()}`;
const slug = (name) => `${prefix}-${name}`;
let db;
if (useDb) {
  const { default: postgres } = await import("postgres");
  db = postgres(process.env.TEST_DATABASE_URL, { onnotice: () => {} });
}

after(async () => {
  await store.closeDatabase();
  if (db) {
    for (const table of [
      "post_comments",
      "post_stats",
      "post_likes",
      "post_view_events",
      "post_like_events",
      "post_view_receipts",
    ])
      await db`DELETE FROM ${db(table)} WHERE slug LIKE ${`${prefix}%`}`;
    await db`DELETE FROM api_rate_limits WHERE key LIKE ${`${prefix}%`}`;
    await db`DELETE FROM daily_report_logs WHERE report_date = '2001-01-01'`;
    await db.end();
  }
  await rm(folder, { recursive: true, force: true });
});

test("parallel repeated likes and views are counted once per visitor", async () => {
  const target = slug("counts");
  await Promise.all(Array.from({ length: 12 }, () => store.setPostLike(target, true, "visitor-a")));
  await Promise.all(Array.from({ length: 12 }, () => store.incrementPostView(target, "visitor-a")));
  assert.deepEqual(await store.getPostStats(target, "visitor-a"), {
    views: 1,
    likeCount: 1,
    commentCount: 0,
    liked: true,
  });
  await store.setPostLike(target, false, "unrelated-visitor");
  assert.equal((await store.getPostStats(target)).likeCount, 1);
  await Promise.all(Array.from({ length: 8 }, () => store.setPostLike(target, false, "visitor-a")));
  assert.equal((await store.getPostStats(target)).likeCount, 0);
});

test("different visitors' concurrent writes are not lost", async () => {
  const target = slug("parallel");
  await Promise.all(
    Array.from({ length: 20 }, (_, index) => store.setPostLike(target, true, `visitor-${index}`)),
  );
  assert.equal((await store.getPostStats(target)).likeCount, 20);
});

test("comment ownership, parent validation, editing and cascade deletion", async () => {
  const target = slug("comments");
  const created = await store.createPostComment(target, {
    nickname: "작성자",
    password: "test-password",
    content: "원문",
  });
  const root = created.comments[0];
  assert.equal(JSON.stringify(created).includes("passwordHash"), false);
  assert.equal(
    (
      await store.updatePostComment(target, {
        commentId: root.id,
        password: "wrong",
        content: "변경",
      })
    ).error,
    "invalid_password",
  );
  const updated = await store.updatePostComment(target, {
    commentId: root.id,
    password: "test-password",
    content: "수정본",
  });
  assert.equal(updated.comments[0].content, "수정본");
  assert.equal(
    (
      await store.createPostComment(slug("other"), {
        nickname: "답글",
        password: "pass",
        content: "내용",
        parentId: root.id,
      })
    ).error,
    "invalid_parent",
  );
  const reply = await store.createPostComment(target, {
    nickname: "답글",
    password: "pass",
    content: "답글 내용",
    parentId: root.id,
  });
  assert.equal(reply.comments[0].replies.length, 1);
  const deleted = await store.deletePostComment(target, {
    commentId: root.id,
    password: "test-password",
  });
  assert.equal(deleted.stats.commentCount, 0);
  assert.deepEqual(deleted.comments, []);
});

test("legacy SHA-256 passwords continue to work and new passwords use salted scrypt", async () => {
  const legacy = createHash("sha256").update("legacy").digest("hex");
  assert.equal(await verifyPassword("legacy", legacy), true);
  assert.equal(await verifyPassword("wrong", legacy), false);
  const first = await hashPassword("same-password");
  const second = await hashPassword("same-password");
  assert.notEqual(first, second);
  assert.ok(first.startsWith("scrypt:"));
  assert.equal(await verifyPassword("same-password", first), true);
});

test("existing totals and comments survive storage migration and hashes upgrade on edit", async () => {
  const target = slug("legacy");
  const id = randomUUID();
  const hash = createHash("sha256").update("legacy").digest("hex");
  if (db) {
    await db`INSERT INTO post_stats (slug, views, likes) VALUES (${target}, 40, 8)`;
    await db`INSERT INTO post_comments (id, slug, nickname, password_hash, content) VALUES (${id}, ${target}, 'old', ${hash}, 'before')`;
  } else {
    const data = JSON.parse(await readFile(process.env.BLOG_STORE_PATH, "utf8"));
    data.posts[target] = {
      views: 40,
      likes: 8,
      comments: [
        {
          id,
          nickname: "old",
          passwordHash: hash,
          content: "before",
          createdAt: new Date().toISOString(),
        },
      ],
    };
    await writeFile(process.env.BLOG_STORE_PATH, JSON.stringify(data));
  }
  const updated = await store.updatePostComment(target, {
    commentId: id,
    password: "legacy",
    content: "after",
  });
  assert.deepEqual(updated.stats, { views: 40, likeCount: 8, commentCount: 1 });
  const storedHash = db
    ? (await db`SELECT password_hash FROM post_comments WHERE id = ${id}`)[0].password_hash
    : JSON.parse(await readFile(process.env.BLOG_STORE_PATH, "utf8")).posts[target].comments[0]
        .passwordHash;
  assert.ok(storedHash.startsWith("scrypt:"));
});

test("rate limit is shared and atomic under concurrent requests", async () => {
  const results = await Promise.all(
    Array.from({ length: 12 }, () => store.consumeRateLimit(slug("rate"), 5, 60000)),
  );
  assert.equal(results.filter((result) => result.allowed).length, 5);
  assert.ok(results.every((result) => result.retryAfter > 0));
});

test("report claim excludes parallel deliveries and only the owner can release", async () => {
  const date = "2001-01-01";
  const results = await Promise.all(
    Array.from({ length: 8 }, () => store.claimDailyReportDelivery(date)),
  );
  const token = results.find(Boolean);
  assert.equal(results.filter(Boolean).length, 1);
  await store.releaseDailyReportDelivery(date, "not-the-owner");
  assert.equal(await store.claimDailyReportDelivery(date), null);
  await store.releaseDailyReportDelivery(date, token);
  const second = await store.claimDailyReportDelivery(date);
  assert.ok(second);
  await store.completeDailyReportDelivery(date, second);
  assert.equal(await store.claimDailyReportDelivery(date), null);
});

test("KST report window crosses UTC day boundary correctly", () => {
  const day = store.getKstDayWindow(1, new Date("2026-11-18T22:00:00Z"));
  assert.equal(day.dateKey, "2026-11-18");
  assert.equal(day.start.toISOString(), "2026-11-17T15:00:00.000Z");
  assert.equal(day.end.toISOString(), "2026-11-18T15:00:00.000Z");
});

test("file writes are safe across independent processes", { skip: useDb }, async () => {
  const target = slug("processes");
  const moduleUrl = new URL("../lib/blog-store.js", import.meta.url).href;
  await Promise.all(
    Array.from(
      { length: 4 },
      (_, index) =>
        new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              "--input-type=module",
              "-e",
              `const s = await import(${JSON.stringify(moduleUrl)}); await Promise.all(Array.from({length: 5}, (_, n) => s.setPostLike(${JSON.stringify(target)}, true, 'worker-${index}-'+n)));`,
            ],
            { env: process.env, stdio: ["ignore", "ignore", "pipe"] },
          );
          let error = "";
          child.stderr.on("data", (data) => {
            error += data;
          });
          child.on("error", reject);
          child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(error))));
        }),
    ),
  );
  assert.equal((await store.getPostStats(target)).likeCount, 20);
});
