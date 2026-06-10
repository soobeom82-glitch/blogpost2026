import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featuredPost, ...otherPosts] = posts;
  const latestPosts = otherPosts.slice(0, 4);
  const firstPost = posts.at(-1) || null;
  const highlightOrder = [
    "parking-auction-origin-part-1",
    "parking-auction-lpr-error-part-6",
    "parking-auction-trash-fraud-part-8"
  ];
  const highlightPosts = highlightOrder
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter(Boolean);
  const parkingPosts = posts.filter((post) => post.category === "무인주차장");
  const groupedParkingPosts = groupPostsBySeriesType(parkingPosts);

  return (
    <div className="home-grid">
      <section className="intro-panel">
        <div className="intro-copy">
          <p className="eyebrow">처음 오신 분께</p>
          <h2>실제 사업 운영 중 생긴 문제와 판단을 AI 인터뷰로 기록합니다.</h2>
          <p>
            직장인이 공영주차장을 직접 운영하며 겪은 민원, 사고, 영업, 세무 판단을 제가
            인터뷰 형식으로 정리합니다. 잘 포장된 후기보다, 실제로 어떻게 버티고 풀었는지에
            가까운 기록입니다.
          </p>
          <ul className="intro-points">
            <li>문제가 터졌을 때 어떻게 처리했는지</li>
            <li>주변 변화를 읽고 어떻게 매출을 만들었는지</li>
            <li>결국 어떤 판단으로 사업을 끌고 갔는지</li>
          </ul>
          <div className="intro-actions">
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
            <h3>이 사이트를 읽는 이유</h3>
            <p>
              검색으로는 잘 안 나오는 운영 감각, 즉 `이 상황에서 실제로 어떤 선택을 했는지`를
              사건 단위로 읽을 수 있습니다.
            </p>
          </div>

          <div className="intro-card">
            <h3>처음이라면</h3>
            <p>
              주차장 시리즈를 순서대로 읽으면 가장 잘 들어옵니다. 앞편의 판단이 뒷편의 대응으로
              이어지는 구조라서, 1편부터 읽을수록 맥락이 선명해집니다.
            </p>
          </div>

          <div className="intro-card">
            <h3>대표 사건 3개</h3>
            <ul className="intro-link-list">
              {highlightPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>
                    <strong>{post.title}</strong>
                    <span>{post.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="series-overview">
        <div className="section-head">
          <h2>이 사이트의 글은 크게 세 갈래입니다</h2>
          <p>처음 온 사람도 어디부터 읽을지 바로 고를 수 있게 나눴습니다.</p>
        </div>
        <div className="series-overview-grid">
          {groupedParkingPosts.map((group) => (
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
