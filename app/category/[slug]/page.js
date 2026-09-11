import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../../../lib/posts";

const categoryMap = {
  parking: {
    label: "주차장",
    description:
      "주차장 공매, 공영주차장 낙찰, 무인 운영, 추가 수익화, 민원과 사고 대응까지. 입찰 전 가이드와 실제 운영 기록을 함께 정리한 주차장 아카이브입니다.",
    browseLabel: "공매 가이드와 실제 운영 기록"
  },
  cafe: {
    label: "무인카페",
    description:
      "무인카페를 실제로 운영하며 겪은 고객 문제, 시설, 상품, 공간 관리와 운영 자동화 경험을 기록합니다.",
    browseLabel: "무인 운영 기록"
  },
  "shared-kitchen": {
    label: "공유주방",
    description:
      "공유주방을 구축하고 입점업체를 운영하면서 겪은 시설 공사, HACCP, 임대·계약, 세무와 운영 문제를 기록합니다.",
    browseLabel: "공유주방 운영 기록"
  }
};

export async function generateStaticParams() {
  return Object.keys(categoryMap).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = categoryMap[slug];

  if (!category) return {};

  return {
    title:
      slug === "parking"
        ? "주차장 공매, 낙찰, 운영 기록 | Operator's Log"
        : `${category.label} 운영 기록 | Operator's Log`,
    description: category.description
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = categoryMap[slug];

  if (!category) notFound();

  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) => post.primaryCategory === slug);
  const otherPosts = allPosts.filter((post) => post.primaryCategory !== slug);
  const firstGuidePost = posts.find((post) => post.slug === "parking-auction-guide-part-1");
  const firstPost = posts.find((post) => post.slug === "parking-auction-origin-part-1");
  const groupedPosts = groupPostsBySeriesType(posts);

  return (
    <div className="category-page">
      <header className="category-header">
        <p className="eyebrow">Business archive</p>
        <h1>{category.label} 운영 기록</h1>
        <p className="category-summary">{category.description}</p>
        <div className="category-meta-row">
          <p className="category-count">현재 공개 글 {posts.length}편</p>
          {firstGuidePost ? <Link href={`/blog/${firstGuidePost.slug}`} className="text-button category-first-link">공매 가이드부터 보기</Link> : null}
          {firstPost ? <Link href={`/blog/${firstPost.slug}`} className="text-button category-first-link">실전 1편 보기</Link> : null}
        </div>
      </header>

      {posts.length ? (
        <section className="post-section">
          <div className="section-head">
            <h2>{category.browseLabel}</h2>
            <p>글마다 사업 카테고리와 운영 주제를 함께 표시합니다.</p>
          </div>
          <div className="post-list">
            {posts.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        </section>
      ) : <section className="category-empty"><p>아직 공개된 글이 없습니다. 이 카테고리의 운영 기록을 준비하고 있습니다.</p></section>}

      {groupedPosts.length > 1 ? (
        <section className="series-overview">
          <div className="section-head">
            <h2>주차장 기록의 흐름</h2>
            <p>기존 공매 가이드와 운영 연재는 그대로 이어집니다.</p>
          </div>
          <div className="series-overview-grid">
            {groupedPosts.map((group) => (
              <article key={group.key} className="series-overview-card">
                <p className="eyebrow">{group.posts.length}편 공개</p>
                <h3>{group.label}</h3>
                <p>{group.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="category-more">
        <div className="section-head">
          <h2>다른 사업 기록</h2>
          <p>주차장 밖의 운영 경험도 같은 방식으로 축적합니다.</p>
        </div>
        <div className="latest-list-wrap">
          {otherPosts.length ? (
            <ul className="latest-list">
              {otherPosts.slice(0, 4).map((post) => (
                <li key={post.slug} className="latest-item">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="latest-category">{post.primaryCategoryLabel} · {post.topicLabels.join(" · ")}</span>
                    <strong>{post.title}</strong>
                    <span className="latest-meta">{post.publishedAt} · 조회 {post.views} · 좋아요 {post.likeCount} · 댓글 {post.commentCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p>다른 사업 기록을 준비하고 있습니다.</p>}
        </div>
      </section>
    </div>
  );
}
