import { allPosts } from "../content/posts";
import { getPostStats, getPostStatsMap } from "./blog-store";

export const seriesTypeMeta = {
  guide: {
    label: "공매 가이드",
    description: "공고 확인, 입찰 판단, 운영 전 체크포인트처럼 공매 기반 사업을 시작하기 전에 먼저 읽을 안내 글입니다."
  },
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

export const primaryCategoryMeta = {
  parking: { label: "주차장" },
  cafe: { label: "무인카페" },
  operations: { label: "운영노트" }
};

export const topicMeta = {
  auction: { label: "공매·입찰" },
  issue: { label: "문제 해결" },
  demand: { label: "수요 발굴" },
  decision: { label: "사업 판단" },
  tax: { label: "세무·회계" },
  legal: { label: "계약·법무" },
  automation: { label: "운영 자동화" },
  facility: { label: "시설·공사" },
  retrospective: { label: "실패·회고" }
};

const postSeriesTypeMap = {
  "parking-auction-guide-part-1": "guide",
  "parking-auction-guide-part-2": "guide",
  "parking-auction-guide-part-3": "guide",
  "parking-auction-guide-part-4": "guide",
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
  "parking-auction-commercial-demand-part-12": "demand",
  "parking-auction-ending-part-13": "decision"
};

const postTrackMap = {
  "parking-auction-guide-part-1": "parking-guide",
  "parking-auction-guide-part-2": "parking-guide",
  "parking-auction-guide-part-3": "parking-guide",
  "parking-auction-guide-part-4": "parking-guide",
  "parking-auction-origin-part-1": "parking-series",
  "parking-auction-reality-part-2": "parking-series",
  "parking-auction-turning-point-part-3": "parking-series",
  "parking-auction-tax-turning-point-part-4": "parking-series",
  "parking-auction-rentalcar-part-5": "parking-series",
  "parking-auction-lpr-error-part-6": "parking-series",
  "parking-auction-barrier-accident-part-7": "parking-series",
  "parking-auction-trash-fraud-part-8": "parking-series",
  "parking-auction-flight-support-part-9": "parking-series",
  "parking-auction-redevelopment-demand-part-10": "parking-series",
  "parking-auction-construction-demand-part-11": "parking-series",
  "parking-auction-commercial-demand-part-12": "parking-series",
  "parking-auction-ending-part-13": "parking-series"
};

const postTopicMap = {
  "parking-auction-tax-turning-point-part-4": ["tax", "decision"],
  "parking-auction-ending-part-13": ["decision", "retrospective"]
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
  const postTrack = postTrackMap[post.slug] || post.category;
  const primaryCategory =
    post.primaryCategory ||
    (post.category === "무인카페"
      ? "cafe"
      : "parking");
  const topics = post.topics || postTopicMap[post.slug] ||
    (seriesType === "guide"
      ? ["auction"]
      : seriesType === "demand"
        ? ["demand"]
        : seriesType === "decision"
          ? ["decision"]
          : ["issue"]);

  return {
    ...post,
    seriesType,
    seriesTypeLabel: seriesTypeMeta[seriesType]?.label || "문제 해결",
    postTrack,
    primaryCategory,
    primaryCategoryLabel: primaryCategoryMeta[primaryCategory]?.label || post.category,
    topics,
    topicLabels: topics.map((topic) => topicMeta[topic]?.label || topic)
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
  return posts.filter((post) => post.primaryCategory === category);
}

export async function getRelatedPosts(slug, limit = 3) {
  const currentPost = await getPostBySlug(slug);

  if (!currentPost) {
    return [];
  }

  const posts = await getAllPosts();

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score:
        (post.primaryCategory === currentPost.primaryCategory ? 3 : 0) +
        post.topics.filter((topic) => currentPost.topics.includes(topic)).length * 2
    }))
    .sort((a, b) => b.score - a.score || (a.post.publishedAt < b.post.publishedAt ? 1 : -1))
    .slice(0, limit)
    .map(({ post }) => post);
}

export async function getAdjacentPosts(slug) {
  const currentPost = allPosts.find((post) => post.slug === slug) || null;

  if (!currentPost) {
    return {
      previousPost: null,
      nextPost: null
    };
  }

  const currentTrack = postTrackMap[slug] || currentPost.category;
  const trackPosts = allPosts.filter(
    (post) => (postTrackMap[post.slug] || post.category) === currentTrack
  );
  const currentIndex = trackPosts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return {
      previousPost: null,
      nextPost: null
    };
  }

  return {
    previousPost: trackPosts[currentIndex - 1] || null,
    nextPost: trackPosts[currentIndex + 1] || null
  };
}

export function groupPostsBySeriesType(posts) {
  const order = ["guide", "issue", "demand", "decision"];

  return order
    .map((key) => ({
      key,
      ...seriesTypeMeta[key],
      posts: posts.filter((post) => post.seriesType === key)
    }))
    .filter((group) => group.posts.length > 0);
}
