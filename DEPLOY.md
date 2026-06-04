# Vercel Deploy

## Why this stack

- Write posts as `.mdx`
- Commit them to Git
- Let Vercel build and publish automatically
- Keep the workflow simple enough to keep posting

Official references:

- Next.js MDX guide: https://nextjs.org/docs/app/guides/mdx
- Next.js on Vercel: https://vercel.com/docs/concepts/next.js/overview

## Deploy steps

1. Use Node `20+`.
2. Create a GitHub repository from this project.
3. Push the code.
4. Go to Vercel and import the repository as a new project.
5. Set `NEXT_PUBLIC_SITE_URL` to your real domain in Vercel environment variables.
6. Accept the detected Next.js settings and deploy.
7. Add your custom domain in Vercel after the first deploy succeeds.
8. Connect a Postgres database in Vercel Storage so likes, comments, and view counts are shared across all users.
9. Confirm the project has one of these environment variables after the database is connected:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
10. Redeploy once after the database is attached.
11. Set these environment variables before requesting AdSense review:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_CONTACT_EMAIL`
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional, for Google site verification)
   - `NEXT_PUBLIC_ADSENSE_CLIENT` (optional until AdSense is approved, format: `ca-pub-xxxxxxxxxxxxxxxx`)
   - `COMMENT_ADMIN_PASSWORD` (optional, enables operator-side forced comment deletion)
   - `TELEGRAM_BOT_TOKEN` (optional, enables Telegram notifications)
   - `TELEGRAM_CHAT_ID` (optional, target chat id for Telegram notifications)
12. After `NEXT_PUBLIC_ADSENSE_CLIENT` is set, this project will automatically:
   - inject the AdSense script
   - expose `/ads.txt` using the same publisher id
13. After `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set, this project will automatically:
   - send a Telegram message when a post page view is recorded
   - send a Telegram message when a reply comment is created
   - send a Telegram message when a post receives a like
   - send a daily Telegram report at 07:00 KST for the previous day's visits, likes, and comments
14. Daily report endpoints:
   - scheduled: `/api/cron/daily-report`
   - manual preview send: `/api/cron/daily-report?preview=1`

Vercel documents Next.js deployment as zero-configuration when importing a Next.js project.

## Posting workflow

1. Add a new file under `content/posts/`.
2. Start each file with:

```mdx
export const metadata = {
  title: "글 제목",
  publishedAt: "2026-05-31",
  category: "무인주차장",
  summary: "한 줄 요약"
};
```

3. Write the body in Markdown/MDX.
4. Commit and push.
5. Vercel rebuilds and publishes the post.

Current posts already wired in:

- `content/posts/parking-auction-origin-part-1.mdx`
- `content/posts/parking-auction-reality-part-2.mdx`
