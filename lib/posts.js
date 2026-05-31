import { allPosts } from "../content/posts";

export async function getPostBySlug(slug) {
  return allPosts.find((post) => post.slug === slug) || null;
}

export async function getAllPosts() {
  return [...allPosts].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}
