import { allPosts } from "../content/posts";
import { getPostStats, getPostStatsMap } from "./blog-store";

export async function getPostBySlug(slug) {
  const post = allPosts.find((item) => item.slug === slug) || null;

  if (!post) {
    return null;
  }

  const stats = await getPostStats(slug);

  return {
    ...post,
    ...stats
  };
}

export async function getAllPosts() {
  const statsMap = await getPostStatsMap(allPosts.map((post) => post.slug));

  return [...allPosts]
    .map((post) => ({
      ...post,
      ...statsMap[post.slug]
    }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
