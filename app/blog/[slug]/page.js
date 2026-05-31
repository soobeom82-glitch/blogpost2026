import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "../../../lib/posts";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Operator's Log`,
    description: post.summary
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const Content = post.Content;

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

      <div className="post-body">
        <Content />
      </div>
    </article>
  );
}
