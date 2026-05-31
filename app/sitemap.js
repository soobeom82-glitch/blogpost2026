import { getAllPosts } from "../lib/posts";

export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const posts = await getAllPosts();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date()
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt
    }))
  ];
}
