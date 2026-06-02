import { allPosts } from "../content/posts";
import { getPostStats, getPostStatsMap } from "./blog-store";

function createZeroStats() {
  return {
    views: 0,
    likeCount: 0,
    commentCount: 0
  };
}

export async function getPostBySlug(slug) {
  const post = allPosts.find((item) => item.slug === slug) || null;

  if (!post) {
    return null;
  }

  let stats = createZeroStats();

  try {
    stats = await getPostStats(slug);
  } catch {
    stats = createZeroStats();
  }

  return {
    ...post,
    ...stats
  };
}

export async function getAllPosts() {
  let statsMap = {};

  try {
    statsMap = await getPostStatsMap(allPosts.map((post) => post.slug));
  } catch {
    statsMap = {};
  }

  return [...allPosts]
    .map((post) => ({
      ...post,
      ...createZeroStats(),
      ...statsMap[post.slug]
    }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getPostsByCategory(category) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category === category);
}

export async function getAdjacentPosts(slug) {
  const currentIndex = allPosts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return {
      previousPost: null,
      nextPost: null
    };
  }

  return {
    previousPost: allPosts[currentIndex - 1] || null,
    nextPost: allPosts[currentIndex + 1] || null
  };
}
