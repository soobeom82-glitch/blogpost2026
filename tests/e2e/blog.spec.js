import { test, expect } from "@playwright/test";

const slug = "parking-auction-guide-part-1";
const path = `/blog/${slug}`;
const api = `/api/posts/${slug}`;
const origin = "http://127.0.0.1:3107";
const headers = { Origin: origin };

test("guide navigation, topic filter, canonical and mobile layout", async ({ page }) => {
  await page.goto(path);
  await expect(page.locator(".post-pagination")).not.toContainText("가이드.4");
  await expect(page.locator(".post-pagination a")).toHaveAttribute(
    "href",
    "/blog/parking-auction-guide-part-2",
  );
  await page.goto("/blog/parking-auction-guide-part-3");
  await expect(page.locator(".post-pagination a").last()).toHaveAttribute(
    "href",
    "/blog/parking-auction-guide-part-4",
  );
  await page.goto("/");
  await page.locator('a[href="/operations?topic=issue"]').click();
  await expect(page.locator(".topic-chip.is-active")).toHaveText("문제 해결");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://blogpost2026.vercel.app/operations",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".post-card").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("like survives reload without adding one; failure does not pretend to save", async ({
  page,
}) => {
  await page.goto(path);
  const like = page.getByRole("button", { name: /^좋아요/ });
  await expect(like).toBeEnabled();
  const before = Number((await like.textContent()).match(/\d+/)[0]);
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText(`좋아요 ${before + 1}`);
  await page.reload();
  await expect(like).toBeEnabled();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText(`좋아요 ${before + 1}`);
  await page.route("**/likes", async (route) => {
    if (route.request().method() === "POST")
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "저장 실패" }),
      });
    else await route.continue();
  });
  await like.click();
  await expect(page.getByRole("status").filter({ hasText: "저장 실패" })).toBeVisible();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText(`좋아요 ${before + 1}`);
});

test("comment create, reply, password edit and cascade delete through the UI", async ({ page }) => {
  await page.goto(path);
  const form = page.locator(".comments-section > .comment-form");
  await form.getByRole("textbox", { name: "닉네임" }).fill("검증 사용자");
  await form.getByLabel("댓글 비밀번호").fill("test-password");
  await form.getByRole("textbox", { name: "댓글 내용" }).fill("브라우저 검증 댓글");
  await form.getByRole("button", { name: "댓글 등록" }).click();
  const item = page
    .locator(".comment-list > .comment-item")
    .filter({ hasText: "브라우저 검증 댓글" });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: "답글 달기", exact: true }).click();
  const reply = item.locator(".comment-form");
  await reply.getByLabel("닉네임").fill("답글 사용자");
  await reply.getByLabel("댓글 비밀번호").fill("reply-password");
  await reply.getByLabel("댓글 내용").fill("브라우저 검증 답글");
  await reply.getByRole("button", { name: "답글 등록" }).click();
  await expect(item.locator(".reply-list")).toContainText("브라우저 검증 답글");
  await item
    .locator(".comment-bubble")
    .first()
    .getByRole("button", { name: "수정", exact: true })
    .click();
  await item.getByLabel("수정할 댓글 내용").fill("수정된 브라우저 검증 댓글");
  await item.locator(".comment-manage-form").getByLabel("댓글 비밀번호").fill("test-password");
  await item.getByRole("button", { name: "수정 저장" }).click();
  await expect(item.locator(".comment-bubble").first()).toContainText("수정된 브라우저 검증 댓글");
  await item
    .locator(".comment-bubble")
    .first()
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  await item.locator(".comment-manage-form").getByLabel("댓글 비밀번호").fill("test-password");
  await item.getByRole("button", { name: "댓글 삭제" }).click();
  await expect(page.locator(".comment-list")).not.toContainText("브라우저 검증 댓글");
  await expect(page.locator(".comment-list")).not.toContainText("브라우저 검증 답글");
});

test("API validation, idempotency and protected read-only report preview", async ({ request }) => {
  expect((await request.get("/api/cron/daily-report")).status()).toBe(401);
  const preview = await request.get("/api/cron/daily-report?preview=1", {
    headers: { Authorization: "Bearer local-e2e-cron-secret" },
  });
  expect(preview.status()).toBe(200);
  expect((await preview.json()).preview).toBe(true);
  expect(
    (
      await request.post("/api/posts/not-a-real-post/likes", { headers, data: { liked: true } })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post(`${api}/likes`, {
        headers: { Origin: "https://elsewhere.example" },
        data: { liked: true },
      })
    ).status(),
  ).toBe(403);
  await request.get(`${api}/likes`);
  expect((await request.post(`${api}/likes`, { headers, data: { liked: "yes" } })).status()).toBe(
    400,
  );
  const first = await (
    await request.post(`${api}/likes`, { headers, data: { liked: true } })
  ).json();
  const second = await (
    await request.post(`${api}/likes`, { headers, data: { liked: true } })
  ).json();
  expect(second.likeCount).toBe(first.likeCount);
  expect(
    (
      await request.post(`${api}/comments`, {
        headers,
        data: { nickname: [], password: "pass", content: "text" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${api}/comments`, {
        headers,
        data: { nickname: "user", password: "pass", content: "text", parentId: "fake-id" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${api}/comments`, {
        headers,
        data: { nickname: "user", password: "pass", content: "x".repeat(5001) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${api}/comments`, {
        headers: { ...headers, "Content-Type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
});

test("like request limit cannot be bypassed by supplying a different X-Forwarded-For", async ({
  request,
}) => {
  await request.get(`${api}/likes`);
  let limited;
  for (let index = 0; index < 31; index++) {
    const response = await request.post(`${api}/likes`, {
      headers: { ...headers, "X-Forwarded-For": `192.0.2.${index}` },
      data: { liked: true },
    });
    if (response.status() === 429) {
      limited = response;
      break;
    }
    expect(response.status()).toBe(200);
  }
  expect(limited).toBeTruthy();
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});
