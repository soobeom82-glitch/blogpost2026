import Link from "next/link";
import ShareButton from "./share-button";

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <Link
        href={`/blog/${post.slug}`}
        className="post-visual"
        aria-label={post.title}
      >
        <span className="post-visual-kicker">{post.category}</span>
      </Link>

      <div className="post-card-top">
        <p className="post-meta">
          <span>{post.category}</span>
          <span>{post.publishedAt}</span>
        </p>
        <ShareButton
          className="ghost-button"
          title={post.title}
          path={`/blog/${post.slug}`}
          label="공유"
        />
      </div>

      <div className="post-card-body">
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.summary}</p>
      </div>

      <div className="post-card-footer">
        <div className="metric-row">
          <span>조회 {post.views}</span>
          <span>댓글 {post.commentCount}</span>
        </div>
        <Link className="solid-link" href={`/blog/${post.slug}`}>
          읽기
        </Link>
      </div>
    </article>
  );
}
