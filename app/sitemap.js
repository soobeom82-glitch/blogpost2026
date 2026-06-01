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
    {
      url: `${baseUrl}/about`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/category/parking`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/category/cafe`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: new Date()
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt
    }))
  ];
}
