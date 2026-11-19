import Image from "next/image";
import Link from "next/link";

export default function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={post.section === "personal" && !post.image ? "post-card post-card-text" : "post-card"} aria-label={post.title}>
      {post.section !== "personal" || post.image ? <div className="post-visual">
        <Image
          width={1200}
          height={800}
          sizes="(max-width: 760px) 100vw, 50vw"
          className="post-visual-image"
          loading="lazy"
          src={post.image || "/images/site-representative.jpg"}
          alt={post.imageAlt || post.title}
        />
        <span className="post-visual-kicker">{post.primaryCategoryLabel || post.category}</span>
      </div> : null}

      <div className="post-card-top">
        <p className="post-meta">
          <span>{post.primaryCategoryLabel || post.category}</span>
          {post.topicLabels?.length ? <span>{post.topicLabels.join(" · ")}</span> : null}
          <span>{post.publishedAt}</span>
        </p>
      </div>

      <div className="post-card-body">
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
      </div>

      <div className="post-card-footer">
        <div className="metric-row">
          <span>조회 {post.statsUnavailable ? "—" : post.views}</span>
          <span>좋아요 {post.statsUnavailable ? "—" : post.likeCount}</span>
          <span>댓글 {post.statsUnavailable ? "—" : post.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
