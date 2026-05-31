import Link from "next/link";
import CommentsSection from "../../../components/comments-section";
import PostEngagement from "../../../components/post-engagement";
import { notFound } from "next/navigation";
import { getPostComments } from "../../../lib/blog-store";
import { getAdjacentPosts, getAllPosts, getPostBySlug } from "../../../lib/posts";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Operator's Log`,
    description: post.summary
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const Content = post.Content;
  const comments = await getPostComments(slug);
  const { previousPost, nextPost } = await getAdjacentPosts(slug);

  return (
    <article className="post-page">
      <a className="back-link" href="/">
        ← 목록으로
      </a>

      <header className="post-header">
        <p className="post-meta">
          <span>{post.category}</span>
          <span>{post.publishedAt}</span>
        </p>
        <h1>{post.title}</h1>
        <p className="post-summary">{post.summary}</p>
      </header>

      {post.image ? (
        <figure className="post-hero">
          <img src={post.image} alt={post.imageAlt || post.title} />
          {post.imageCaption ? (
            <figcaption>{post.imageCaption}</figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="post-body">
        <Content />
      </div>

      <PostEngagement
        slug={slug}
        title={post.title}
        initialViews={post.views}
        initialLikeCount={post.likeCount}
        initialCommentCount={post.commentCount}
      />

      {previousPost || nextPost ? (
        <nav className="post-pagination" aria-label="연재 이동">
          {previousPost ? (
            <Link href={`/blog/${previousPost.slug}`} className="post-page-link">
              <span className="post-page-label">이전글</span>
              <strong>{previousPost.title}</strong>
            </Link>
          ) : (
            <div className="post-page-link post-page-link-empty" aria-hidden="true" />
          )}

          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="post-page-link">
              <span className="post-page-label">다음글</span>
              <strong>{nextPost.title}</strong>
            </Link>
          ) : (
            <div className="post-page-link post-page-link-empty" aria-hidden="true" />
          )}
        </nav>
      ) : null}

      <div className="post-bottom-actions">
        <a className="back-link back-link-bottom" href="/">
          ← 목록으로
        </a>
      </div>

      <CommentsSection
        slug={slug}
        initialComments={comments}
        initialCommentCount={post.commentCount}
      />
    </article>
  );
}
