import { test, expect } from "@playwright/test";

test("database outage preserves the article and explains unavailable comments", async ({
  page,
  request,
}) => {
  const response = await page.goto("/blog/parking-auction-guide-part-1", {
    waitUntil: "domcontentloaded",
  });
  expect(response.status()).toBe(200);
  await expect(page.locator(".post-header h1")).toContainText("가이드.1");
  await expect(page.locator(".post-body")).not.toBeEmpty();
  await expect(page.locator(".comments-section").getByRole("status")).toContainText(
    "댓글을 불러오지 못했습니다",
  );
  const api = await request.get("/api/posts/parking-auction-guide-part-1/comments");
  expect(api.status()).toBe(503);
  expect(JSON.stringify(await api.json())).not.toContain("postgres://");
});
