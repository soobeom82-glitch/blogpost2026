import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const STORE_PATH = path.join(process.cwd(), "data", "blog-store.json");

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
      comments: []
    };
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

export async function getPostStats(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  return {
    views: post.views,
    commentCount: countComments(post.comments)
  };
}

export async function getPostStatsMap(slugs) {
  const store = await readStore();

  return Object.fromEntries(
    slugs.map((slug) => {
      const post = ensurePost(store, slug);

      return [
        slug,
        {
          views: post.views,
          commentCount: countComments(post.comments)
        }
      ];
    })
  );
}

export async function incrementPostView(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  post.views += 1;

  await writeStore(store);

  return {
    views: post.views,
    commentCount: countComments(post.comments)
  };
}

export async function getPostComments(slug) {
  const store = await readStore();
  const post = ensurePost(store, slug);

  return sanitizeCommentTree(buildCommentTree(post.comments));
}

export async function createPostComment(
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
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

export async function updatePostComment(
  slug,
  { commentId, password, content }
) {
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
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}

export async function deletePostComment(slug, { commentId, password }) {
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
      commentCount: countComments(post.comments)
    },
    comments: sanitizeCommentTree(buildCommentTree(post.comments))
  };
}
