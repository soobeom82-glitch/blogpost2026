import { getAllPosts } from "../../lib/posts";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://blogpost2026.vercel.app");

  const posts = await getAllPosts();
  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${pubDate}</pubDate>
          <description>${escapeXml(post.summary)}</description>
        </item>
      `.trim();
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Operator&apos;s Log</title>
    <link>${siteUrl}</link>
    <description>실전 사업 운영 인터뷰 모음</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
