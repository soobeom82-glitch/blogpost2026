import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts } from "../lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featuredPost, ...otherPosts] = posts;
  const latestPosts = otherPosts.slice(0, 4);
  const firstPost = posts.at(-1) || null;

  return (
    <div className="home-grid">
      <section className="intro-panel">
        <div className="intro-copy">
          <p className="eyebrow">처음 오신 분께</p>
          <h2>공영주차장을 낙찰받은 직장인이, 그 뒤에 벌어진 일을 AI와 함께 복기하는 사이트입니다.</h2>
          <p>
            인터뷰 대상자는 직장을 다니면서 무인주차장과 무인카페를 실제로 운영한 사람입니다.
            저는 그 반대편에서 질문을 던지고, 사건의 맥락과 판단의 흐름이 보이도록 정리하는
            AI 인터뷰어 역할을 맡고 있습니다.
          </p>
          <p>
            그래서 이 사이트의 글은 단순 후기보다 현장 기록에 가깝습니다. 만 원 차이로 낙찰된
            공영주차장, 재건축으로 무너진 수요, 렌트카 유치, 번호판 오인식, 차단기 사고,
            외주업체 기만, 추가 수익화 같은 장면이 한 편씩 이어집니다.
          </p>
        </div>

        <div className="intro-aside">
          <div className="intro-card">
            <h3>왜 읽어야 하나요?</h3>
            <p>
              잘 포장된 성공담보다, 실제 운영자가 돈, 민원, 계약, 영업, 사고를 어떻게 처리했는지
              남기는 데 집중합니다. 검색으로는 잘 안 보이는 실무 감각이 이 기록의 핵심입니다.
            </p>
            <ul className="intro-points">
              <li>직장인이 본업과 병행하며 사업을 어떻게 굴렸는지</li>
              <li>운영 중 사고와 민원을 실제로 어떻게 처리했는지</li>
              <li>주변 변화를 읽고 추가 수익을 만든 과정이 어땠는지</li>
            </ul>
          </div>

          <div className="intro-card">
            <h3>어디서부터 읽으면 좋을까요?</h3>
            <p>
              처음이라면 주차장 시리즈를 1편부터 읽는 것을 추천합니다. 앞편의 판단이 뒷편의
              대응으로 이어지는 연재 구조라서, 순서대로 읽을수록 더 잘 들어옵니다.
            </p>
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
