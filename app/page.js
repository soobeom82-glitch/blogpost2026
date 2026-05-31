import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts } from "../lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featuredPost, ...otherPosts] = posts;
  const latestPosts = otherPosts.slice(0, 4);

  return (
    <div className="home-grid">
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
