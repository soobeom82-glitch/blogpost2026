export async function GET() {
  return new Response(
    "google-site-verification: google9f444cc23fa716ad.html",
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    }
  );
}
