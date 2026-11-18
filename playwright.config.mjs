import { defineConfig, devices } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 3107;
const directory = mkdtempSync(join(tmpdir(), "blog-e2e-"));
export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/outage.spec.js",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      DATABASE_URL: "",
      POSTGRES_URL: "",
      POSTGRES_PRISMA_URL: "",
      VERCEL: "",
      BLOG_STORE_PATH: join(directory, "store.json"),
      ENGAGEMENT_SECRET: "local-e2e-engagement-secret-32-characters",
      CRON_SECRET: "local-e2e-cron-secret",
      COMMENT_ADMIN_PASSWORD: "local-admin-password",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
    },
  },
});
