import StructuredData from "../../../components/structured-data";
import Link from "next/link";
import CommentsSection from "../../../components/comments-section";
import PostEngagement from "../../../components/post-engagement";
import { notFound } from "next/navigation";
import { getPostComments } from "../../../lib/blog-store";
import { getAdjacentPosts, getAllPosts, getPostBySlug, getRelatedPosts } from "../../../lib/posts";

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://blogpost2026.vercel.app");
  const url = `${siteUrl}/blog/${post.slug}`;
  const description = post.seoDescription || post.summary;

  return {
    title: `${post.title} | Operator's Log`,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      images: post.image ? [post.image] : undefined,
      publishedTime: post.publishedAt
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.image ? [post.image] : undefined
    }
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const personal = post.section === "personal";
  const archiveHref = personal ? "/personal" : "/";
  const archiveLabel = personal ? "← 여행·생활 기록으로" : "← 목록으로";
  const Content = post.Content;
  let comments = [];
  let commentsUnavailable = false;
  try { comments = await getPostComments(slug); }
  catch { commentsUnavailable = true; }
  const { previousPost, nextPost, firstPost } = await getAdjacentPosts(slug);
  const relatedPosts = await getRelatedPosts(slug);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://blogpost2026.vercel.app");
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
    image: post.image ? [`${siteUrl}${post.image}`] : undefined,
    articleSection: post.primaryCategoryLabel,
    keywords: post.topicLabels,
    author: {
      "@type": "Organization",
      name: "Operator's Log"
    },
    publisher: {
      "@type": "Organization",
      name: "Operator's Log"
    },
    inLanguage: "ko-KR"
  };

  return (
    <article className="post-page">
      <StructuredData value={articleSchema} />
      <a className="back-link" href={archiveHref}>
        {archiveLabel}
      </a>

      <header className="post-header">
        <p className="post-meta">
          {personal ? <span className="personal-badge">개인 기록</span> : null}
          <span>{post.primaryCategoryLabel}</span>
          {post.topicLabels.map((topic) => <span key={topic}>{topic}</span>)}
          <span>{post.publishedAt}</span>
        </p>
        <h1>{post.title}</h1>
        <p className="post-summary">{post.summary}</p>
        {post.quickTake?.length ? (
          <aside className="quick-take">
            <p className="quick-take-label">먼저 요약하면</p>
            <ul className="quick-take-list">
              {post.quickTake.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        ) : null}
      </header>

      <div className="post-body">
        <Content />
      </div>

      <PostEngagement
        key={slug}
        statsUnavailable={post.statsUnavailable}
        slug={slug}
        title={post.title}
        initialViews={post.views}
        initialLikeCount={post.likeCount}
        initialCommentCount={post.commentCount}
      />

      {relatedPosts.length ? (
        <section className="related-posts">
          <div className="section-head">
            <h2>관련 기록</h2>
            <p>{personal ? "여행과 일상의 비슷한 경험을 모았습니다." : "같은 사업 또는 운영 주제가 겹치는 글입니다."}</p>
          </div>
          <ul className="latest-list">
            {relatedPosts.map((item) => (
              <li key={item.slug} className="latest-item">
                <Link href={`/blog/${item.slug}`}>
                  <span className="latest-category">{item.primaryCategoryLabel} · {item.topicLabels.join(" · ")}</span>
                  <strong>{item.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      {firstPost && firstPost.slug !== slug ? (
        <div className="post-series-actions">
          <Link href={`/blog/${firstPost.slug}`} className="text-button post-series-link">
            첫편 보기
          </Link>
        </div>
      ) : null}

      <div className="post-bottom-actions">
        <a className="back-link back-link-bottom" href={archiveHref}>
          {archiveLabel}
        </a>
      </div>

      <CommentsSection
        key={slug}
        initialUnavailable={commentsUnavailable}
        slug={slug}
        initialComments={comments}
        initialCommentCount={post.commentCount}
        canAdminDelete={Boolean(process.env.COMMENT_ADMIN_PASSWORD)}
      />
    </article>
  );
}
