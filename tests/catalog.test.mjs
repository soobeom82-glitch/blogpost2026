import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { getSeriesNavigation, sortPosts, operationTopics } from "../lib/post-taxonomy.js";

const posts = await Promise.all(
  (await fs.readdir("content/posts"))
    .filter((file) => file.endsWith(".mdx"))
    .map(async (file) => {
      const source = await fs.readFile(`content/posts/${file}`, "utf8");
      return {
        slug: file.slice(0, -4),
        ...vm.runInNewContext(`(${source.match(/^export const metadata = (\{[\s\S]*?\n\});/)[1]})`),
      };
    }),
);

test("all four guides navigate in numbered order regardless of registration order", () => {
  const scrambled = [...posts].reverse();
  for (let order = 1; order <= 4; order++) {
    const result = getSeriesNavigation(scrambled, `parking-auction-guide-part-${order}`);
    assert.equal(result.previousPost?.seriesOrder, order > 1 ? order - 1 : undefined);
    assert.equal(result.nextPost?.seriesOrder, order < 4 ? order + 1 : undefined);
    assert.equal(result.firstPost.seriesOrder, 1);
  }
});

test("standalone operating notes do not become an accidental series", () => {
  assert.deepEqual(getSeriesNavigation(posts, "tax-invoice-crosscheck-automation"), {
    previousPost: null,
    nextPost: null,
    firstPost: null,
  });
});

test("same-date posts have deterministic ordering and issue topic is supported", () => {
  assert.deepEqual(
    sortPosts(posts).map((p) => p.slug),
    sortPosts([...posts].reverse()).map((p) => p.slug),
  );
  assert.ok(operationTopics.includes("issue"));
});
