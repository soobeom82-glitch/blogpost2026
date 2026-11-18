export const primaryCategoryMeta = {
  parking: { label: "주차장" },
  cafe: { label: "무인카페" },
  operations: { label: "운영노트" },
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
  retrospective: { label: "실패·회고" },
};

export const operationTopics = ["issue", "tax", "legal", "automation", "retrospective"];

export const seriesTypeMeta = {
  guide: {
    label: "공매 가이드",
    description: "공고 확인부터 입찰 전 점검까지 순서대로 읽는 안내입니다.",
  },
  issue: { label: "문제 해결", description: "민원, 사고, 오류에 대응한 기록입니다." },
  demand: { label: "수요 발굴", description: "주변 변화를 읽고 추가 수익을 만든 기록입니다." },
  decision: { label: "사업 판단", description: "사업을 계속하거나 바꾸기로 한 판단의 기록입니다." },
};

export function enrichPost(post) {
  return {
    ...post,
    primaryCategoryLabel: primaryCategoryMeta[post.primaryCategory]?.label || post.category,
    topicLabels: (post.topics || []).map((topic) => topicMeta[topic]?.label || topic),
    seriesTypeLabel: seriesTypeMeta[post.seriesType]?.label,
    postTrack: post.series || null,
  };
}

export function sortPosts(posts) {
  return [...posts].sort(
    (a, b) =>
      b.publishedAt.localeCompare(a.publishedAt) ||
      (b.seriesOrder || 0) - (a.seriesOrder || 0) ||
      a.slug.localeCompare(b.slug),
  );
}

export function getSeriesNavigation(posts, slug) {
  const current = posts.find((post) => post.slug === slug);
  if (!current?.series) return { previousPost: null, nextPost: null, firstPost: null };
  const series = posts
    .filter((post) => post.series === current.series)
    .sort((a, b) => a.seriesOrder - b.seriesOrder);
  const index = series.findIndex((post) => post.slug === slug);
  return {
    previousPost: series[index - 1] || null,
    nextPost: series[index + 1] || null,
    firstPost: series[0] || null,
  };
}
