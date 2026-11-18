# Project working notes

- This is an interview-based Korean business blog, not the tax automation tools described in its articles.
- Keep existing posts and images intact unless a content edit is requested. Do not invent interview answers or business facts.
- Read README.md and DEPLOY.md before changing publishing or runtime behavior.
- For writing episodes, use skills/operators-log-episode-writing/SKILL.md.
- Node 22+; install reproducibly with npm ci. Pin direct dependency versions.
- Edit MDX metadata, then run npm run content:generate. Do not hand-edit content/posts/index.js.
- Series use explicit series/seriesOrder metadata. Standalone posts have no series.
- Verify changes with npm run check and npm run build. For interactive/API changes also run npm run test:e2e.
- For persistence changes run npm run test:db with an isolated TEST_DATABASE_URL ending in _test. Never run tests against production data or send real Telegram messages as a test.
- Preserve legacy engagement totals and comment passwords. Database migrations must be additive unless an explicitly reviewed migration says otherwise.
- Keep secrets out of source, logs and reports. Vercel requires PostgreSQL and ENGAGEMENT_SECRET; cron requires CRON_SECRET.
- Source changes do not establish that external Vercel, Search Console or AdSense settings have been configured. Report unverified service settings accurately.
