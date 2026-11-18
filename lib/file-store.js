import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import lockfile from "proper-lockfile";

const storePath =
  process.env.BLOG_STORE_PATH || path.join(process.cwd(), "data", "blog-store.json");

function assertLocalStore() {
  if (process.env.VERCEL) throw new Error("DATABASE_URL is required on Vercel");
}

export async function readStore() {
  assertLocalStore();
  try {
    return JSON.parse(await fs.readFile(/* turbopackIgnore: true */ storePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { posts: {} };
    throw error;
  }
}

export async function mutateStore(mutate) {
  assertLocalStore();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const release = await lockfile.lock(storePath, {
    realpath: false,
    stale: 30000,
    retries: { retries: 100, minTimeout: 10, maxTimeout: 100 },
  });
  const tempPath = `${storePath}.${randomUUID()}.tmp`;
  try {
    const store = await readStore();
    const result = await mutate(store);
    await fs.writeFile(tempPath, JSON.stringify(store, null, 2), { mode: 0o600 });
    await fs.rename(tempPath, storePath);
    return result;
  } finally {
    await fs.rm(tempPath, { force: true });
    await release();
  }
}
