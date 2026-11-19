import { allPosts } from "../content/posts";
import { getPostStats, getPostStatsMap } from "./blog-store";
import { enrichPost, sortPosts, getSeriesNavigation, seriesTypeMeta, filterPostsBySection, getPostSection } from "./post-taxonomy.js";
export {
  primaryCategoryMeta,
  topicMeta,
  operationTopics,
  seriesTypeMeta,
} from "./post-taxonomy.js";

const zeroStats = () => ({ views: 0, likeCount: 0, commentCount: 0 });

export async function getPostBySlug(slug) {
  const post = allPosts.find((item) => item.slug === slug);
  if (!post) return null;
  try {
    return { ...enrichPost(post), ...(await getPostStats(slug)) };
  } catch {
    return { ...enrichPost(post), ...zeroStats(), statsUnavailable: true };
  }
}

export async function getAllPosts() {
  let stats = {};
  let statsUnavailable = false;
  try {
    stats = await getPostStatsMap(allPosts.map((post) => post.slug));
  } catch {
    statsUnavailable = true;
  }
  return sortPosts(allPosts).map((post) => ({
    ...enrichPost(post),
    ...zeroStats(),
    ...stats[post.slug],
    statsUnavailable,
  }));
}

export async function getPostsByCategory(category) {
  return (await getAllPosts()).filter((post) => post.primaryCategory === category);
}

export async function getPostsBySection(section = "business") {
  return filterPostsBySection(await getAllPosts(), section);
}

export async function getRelatedPosts(slug, limit = 3) {
  const current = allPosts.find((post) => post.slug === slug);
  if (!current) return [];
  return (await getAllPosts())
    .filter((post) => post.slug !== slug && getPostSection(post) === getPostSection(current))
    .map((post) => ({
      post,
      score:
        (post.primaryCategory === current.primaryCategory ? 3 : 0) +
        post.topics.filter((topic) => current.topics.includes(topic)).length * 2,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

export async function getAdjacentPosts(slug) {
  return getSeriesNavigation(allPosts, slug);
}

export function groupPostsBySeriesType(posts) {
  return Object.entries(seriesTypeMeta)
    .map(([key, meta]) => ({
      key,
      ...meta,
      posts: posts.filter((post) => post.seriesType === key),
    }))
    .filter((group) => group.posts.length);
}
