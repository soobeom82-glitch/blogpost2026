import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/outage.spec.js",
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:3108", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3108",
    url: "http://127.0.0.1:3108/about",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: "postgres://nobody:unavailable@127.0.0.1:1/blog_outage_test",
      POSTGRES_URL: "",
      POSTGRES_PRISMA_URL: "",
      VERCEL: "1",
      ENGAGEMENT_SECRET: "local-e2e-engagement-secret-32-characters",
      CRON_SECRET: "local-e2e-cron-secret",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
    },
  },
});
