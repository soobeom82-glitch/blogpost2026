import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts, topicMeta } from "../lib/posts";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "실전 사업 운영 인터뷰 모음 | Operator's Log",
  description: "실제 사업을 운영하며 겪은 공매, 민원, 사고, 세무, 계약, 시설 문제와 판단을 기록합니다."
};

const businessArchives = [
  { slug: "parking", label: "주차장", description: "공영주차장 공매, 낙찰, 무인 운영, 민원과 추가 수익화", href: "/category/parking" },
  { slug: "cafe", label: "무인카페", description: "무인 운영, 고객 문제, 시설, 상품과 운영 자동화", href: "/category/cafe" }
];

const operationTopics = ["issue", "tax", "legal", "automation", "retrospective"];

export default async function HomePage() {
  const posts = await getAllPosts();
  const latestPosts = posts.slice(0, 6);
  const firstGuidePost = posts.find((post) => post.slug === "parking-auction-guide-part-1");
  const topicPosts = operationTopics
    .map((topic) => ({ topic, post: posts.find((post) => post.topics.includes(topic)) }))
    .filter(({ post }) => post);

  return (
    <div className="home-grid">
      <section className="intro-panel intro-panel-wide">
        <div className="intro-copy">
          <p className="eyebrow">Interview-based operating archive</p>
          <h2>사업을 실제로 운영하면서 어떤 판단을 했는지 기록합니다.</h2>
          <p>실제 사업에서 돈이 들어간 판단과 민원, 사고, 세무, 계약, 시설 문제를 AI 인터뷰로 복원합니다.</p>
          <div className="intro-actions">
            <Link href="/about" className="text-button">이 사이트를 읽는 방법</Link>
            <Link href="/operations" className="text-button">운영노트 보기</Link>
          </div>
        </div>
      </section>

      <section className="business-archive-section">
        <div className="section-head">
          <h2>사업별 기록</h2>
          <p>사업마다 다른 현실을, 같은 기준으로 쌓아갑니다.</p>
        </div>
        <div className="business-archive-grid">
          {businessArchives.map((archive) => {
            const latest = posts.find((post) => post.primaryCategory === archive.slug);
            return (
              <Link key={archive.slug} href={archive.href} className="business-archive-card">
                <p className="eyebrow">{latest ? "최근 글 공개" : "기록 준비 중"}</p>
                <h3>{archive.label}</h3>
                <p>{archive.description}</p>
                <span className="business-archive-latest">{latest ? latest.title : `${archive.label} 기록 보기`}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="topic-explorer">
        <div className="section-head">
          <h2>운영하면서 배운 것</h2>
          <Link href="/operations" className="text-button">운영노트 전체 보기</Link>
        </div>
        <div className="topic-explorer-grid">
          {topicPosts.map(({ topic, post }) => (
            <Link key={topic} href={`/operations?topic=${topic}`} className="topic-explorer-card">
              <span>{topicMeta[topic].label}</span>
              <strong>{post.title}</strong>
              <small>{post.primaryCategoryLabel}</small>
            </Link>
          ))}
        </div>
      </section>

      {firstGuidePost ? (
        <section className="guide-callout">
          <div>
            <p className="eyebrow">Parking auction guide</p>
            <h2>주차장 공매를 처음 본다면</h2>
            <p>공고를 찾는 법부터 입찰 전 체크포인트까지 순서대로 정리했습니다.</p>
          </div>
          <Link href={`/blog/${firstGuidePost.slug}`} className="solid-link">공매 가이드 시작하기</Link>
        </section>
      ) : null}

      <section className="post-section">
        <div className="section-head">
          <h2>최신 글</h2>
          <p>사업 카테고리 구분 없이 최신순으로 봅니다.</p>
        </div>
        <div className="post-list">
          {latestPosts.map((post) => <PostCard key={post.slug} post={post} />)}
        </div>
      </section>
    </div>
  );
}
