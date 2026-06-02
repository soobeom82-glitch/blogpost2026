function getPublisherId() {
  const rawClient =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT ||
    process.env.ADSENSE_CLIENT ||
    "";

  if (!rawClient) {
    return "";
  }

  return rawClient.trim().replace(/^ca-/, "");
}

export function GET() {
  const publisherId = getPublisherId();
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Set NEXT_PUBLIC_ADSENSE_CLIENT to enable a valid ads.txt record.\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
