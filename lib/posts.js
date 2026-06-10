import { allPosts } from "../content/posts";
import { getPostStats, getPostStatsMap } from "./blog-store";

export const seriesTypeMeta = {
  issue: {
    label: "문제 해결",
    description: "민원, 사고, 오류, 대응처럼 운영 중 실제로 터진 문제를 어떻게 처리했는지 모은 기록입니다."
  },
  demand: {
    label: "수요 발굴",
    description: "렌트카, 상가, 공사 인력처럼 주변 변화를 읽고 추가 매출을 만든 과정을 모은 기록입니다."
  },
  decision: {
    label: "사업 판단",
    description: "낙찰, 재건축, 세무처럼 사업을 계속할지 바꿀지 결정하게 만든 판단의 흐름을 모은 기록입니다."
  }
};

const postSeriesTypeMap = {
  "parking-auction-origin-part-1": "decision",
  "parking-auction-reality-part-2": "issue",
  "parking-auction-turning-point-part-3": "decision",
  "parking-auction-tax-turning-point-part-4": "decision",
  "parking-auction-rentalcar-part-5": "demand",
  "parking-auction-lpr-error-part-6": "issue",
  "parking-auction-barrier-accident-part-7": "issue",
  "parking-auction-trash-fraud-part-8": "issue",
  "parking-auction-flight-support-part-9": "issue",
  "parking-auction-redevelopment-demand-part-10": "demand",
  "parking-auction-construction-demand-part-11": "demand",
  "parking-auction-commercial-demand-part-12": "demand"
};

function createZeroStats() {
  return {
    views: 0,
    likeCount: 0,
    commentCount: 0
  };
}

function attachSeriesType(post) {
  const seriesType = postSeriesTypeMap[post.slug] || "issue";

  return {
    ...post,
    seriesType,
    seriesTypeLabel: seriesTypeMeta[seriesType]?.label || "문제 해결"
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
    ...attachSeriesType(post),
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
      ...attachSeriesType(post),
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

export function groupPostsBySeriesType(posts) {
  const order = ["issue", "demand", "decision"];

  return order
    .map((key) => ({
      key,
      ...seriesTypeMeta[key],
      posts: posts.filter((post) => post.seriesType === key)
    }))
    .filter((group) => group.posts.length > 0);
}
