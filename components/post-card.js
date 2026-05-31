import Link from "next/link";

export default function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="post-card" aria-label={post.title}>
      <div className="post-visual">
        <img
          className="post-visual-image"
          src={post.image || "/images/site-representative.jpg"}
          alt={post.imageAlt || post.title}
        />
        <span className="post-visual-kicker">{post.category}</span>
      </div>

      <div className="post-card-top">
        <p className="post-meta">
          <span>{post.category}</span>
          <span>{post.publishedAt}</span>
        </p>
      </div>

      <div className="post-card-body">
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
      </div>

      <div className="post-card-footer">
        <div className="metric-row">
          <span>조회 {post.views}</span>
          <span>하트 {post.likeCount}</span>
          <span>댓글 {post.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
