export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://blogpost2026.vercel.app")
  ).replace(/\/$/, "");
}

export function canonical(path = "/") {
  return { canonical: new URL(path, getSiteUrl()).toString() };
}
