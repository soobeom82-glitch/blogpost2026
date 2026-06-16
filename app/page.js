import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../lib/posts";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "주차장 공매, 낙찰, 운영 기록 | Operator's Log",
  description:
    "주차장 공매로 공영주차장을 낙찰받기 전 무엇을 봐야 하는지, 낙찰 후 실제 운영에서 어떤 문제와 판단이 생겼는지 정리한 실전 기록"
};

const searchIntentLinks = [
  {
    label: "공매 가이드부터 보기",
    href: "/blog/parking-auction-guide-part-1"
  },
  {
    label: "실전 운영기 1편부터 보기",
    href: "/blog/parking-auction-origin-part-1"
  },
  {
    label: "주차장 글 전체 보기",
    href: "/category/parking"
  }
];

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featuredPost, ...otherPosts] = posts;
  const latestPosts = otherPosts.slice(0, 4);
  const firstGuidePost =
    posts.find((post) => post.slug === "parking-auction-guide-part-1") || null;
  const firstPost =
    posts.find((post) => post.slug === "parking-auction-origin-part-1") || null;
  const parkingPosts = posts.filter((post) => post.category === "무인주차장");
  const parkingGuidePosts = posts.filter((post) => post.category === "주차장 가이드");
  const groupedParkingPosts = groupPostsBySeriesType(parkingPosts);

  return (
    <div className="home-grid">
      <section className="intro-panel">
        <div className="intro-copy">
          <p className="eyebrow">처음 오신 분께</p>
          <h2>주차장 공매를 어떻게 보고, 낙찰받고, 실제 운영했는지 순서대로 정리합니다.</h2>
          <p>공매 입문 가이드와 실제 운영 기록을 나눠서 정리한 아카이브입니다.</p>
          <div className="intro-actions">
            {firstGuidePost ? (
              <Link href={`/blog/${firstGuidePost.slug}`} className="text-button">
                공매 가이드부터 보기
              </Link>
            ) : null}
            {firstPost ? (
              <Link href={`/blog/${firstPost.slug}`} className="text-button">
                주차장 1편부터 보기
              </Link>
            ) : null}
            <Link href="/about" className="text-button">
              운영자와 인터뷰 방식 보기
            </Link>
          </div>
        </div>

        <div className="intro-aside">
          <div className="intro-card">
            <h3>바로 가기</h3>
            <ul className="intro-link-list">
              {searchIntentLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="intro-card">
            <h3>구성</h3>
            <p>
              입찰 전 판단은 가이드에서, 실제 민원·수익·사고 대응은 운영기에서
              볼 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="series-overview">
        <div className="section-head">
          <h2>이 사이트는 이렇게 읽으면 됩니다</h2>
          <p>가이드와 실전 운영기를 분리해서, 검색 의도에 따라 바로 들어갈 수 있게 정리했습니다.</p>
        </div>
        <div className="series-overview-grid">
          {[...groupPostsBySeriesType(parkingGuidePosts), ...groupedParkingPosts].map((group) => (
            <article key={group.key} className="series-overview-card">
              <p className="eyebrow">{group.posts.length}편 공개</p>
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <Link href="/category/parking" className="text-button">
                {group.label} 글 모아보기
              </Link>
              <ul className="series-overview-list">
                {group.posts.slice(0, 2).map((post) => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-grid">
        <Link
          href={`/blog/${featuredPost.slug}`}
          className="lead-card lead-card-link"
        >
          <div className="lead-visual">
            <img
              className="lead-visual-image"
              src={featuredPost.image || "/images/site-representative.jpg"}
              alt={featuredPost.imageAlt || featuredPost.title}
            />
            <span className="lead-badge">{featuredPost.category}</span>
          </div>

          <div className="lead-content">
            <p className="eyebrow">대표 연재</p>
            <h2>{featuredPost.title}</h2>
            <p className="lead-summary">{featuredPost.summary}</p>

            <div className="lead-footer">
              <div className="metric-row">
                <span>{featuredPost.publishedAt}</span>
                <span>조회 {featuredPost.views}</span>
                <span>좋아요 {featuredPost.likeCount}</span>
                <span>댓글 {featuredPost.commentCount}</span>
              </div>
            </div>
          </div>
        </Link>

        <aside className="latest-panel">
          <div className="section-head">
            <h2>최신 기사</h2>
            <p>최근 공개된 연재</p>
          </div>

          <ul className="latest-list">
            {posts.map((post) => (
              <li key={post.slug} className="latest-item">
                <a href={`/blog/${post.slug}`}>
                  <span className="latest-category">{post.category}</span>
                  <strong>{post.title}</strong>
                  <span className="latest-meta">
                    {post.publishedAt} · 조회 {post.views} · 좋아요{" "}
                    {post.likeCount} · 댓글{" "}
                    {post.commentCount}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="post-section">
        <div className="section-head">
          <h2>최신 스토리</h2>
        </div>

        <div className="post-list">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
