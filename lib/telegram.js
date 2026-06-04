import { allPosts } from "../content/posts";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim() || "";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://blogpost2026.vercel.app");

function isTelegramConfigured() {
  return Boolean(telegramBotToken && telegramChatId);
}

function getPostMeta(slug) {
  const post = allPosts.find((item) => item.slug === slug);

  return {
    title: post?.title || slug,
    url: `${siteUrl.replace(/\/$/, "")}/blog/${slug}`
  };
}

function truncateText(value, length = 140) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();

  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length - 1)}…`;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

async function sendTelegramMessage(text) {
  if (!isTelegramConfigured()) {
    return false;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        disable_web_page_preview: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram notification failed: ${response.status}`);
  }

  return true;
}

export async function notifyPostVisit(slug, views) {
  if (!isTelegramConfigured()) {
    return false;
  }

  const post = getPostMeta(slug);

  return sendTelegramMessage(
    [
      "👀 페이지 방문",
      post.title,
      `누적 조회수: ${views}`,
      post.url
    ].join("\n")
  );
}

export async function notifyReplyComment({ slug, nickname, content }) {
  if (!isTelegramConfigured()) {
    return false;
  }

  const post = getPostMeta(slug);

  return sendTelegramMessage(
    [
      "💬 답글 등록",
      post.title,
      `작성자: ${nickname}`,
      `내용: ${truncateText(content)}`,
      post.url
    ].join("\n")
  );
}

export async function notifyPostLike(slug, likeCount) {
  if (!isTelegramConfigured()) {
    return false;
  }

  const post = getPostMeta(slug);

  return sendTelegramMessage(
    [
      "❤️ 좋아요",
      post.title,
      `누적 좋아요: ${likeCount}`,
      post.url
    ].join("\n")
  );
}

export async function notifyDailyReport(summary, { preview = false } = {}) {
  if (!isTelegramConfigured()) {
    return false;
  }

  const lines = [
    preview
      ? `🧪 전날 블로그 리포트 미리보기 (${summary.label})`
      : `📊 전날 블로그 리포트 (${summary.label})`,
    `방문 ${formatCompactNumber(summary.totals.visits)} · 좋아요 ${formatCompactNumber(summary.totals.likes)} · 댓글 ${formatCompactNumber(summary.totals.comments)}`
  ];

  if (!summary.posts.length) {
    lines.push("", "집계된 반응이 아직 없습니다.");
  } else {
    lines.push("", "반응이 있었던 글");

    for (const [index, item] of summary.posts.slice(0, 5).entries()) {
      const post = getPostMeta(item.slug);

      lines.push(
        `${index + 1}. ${post.title}`,
        `방문 ${formatCompactNumber(item.visits)} · 좋아요 ${formatCompactNumber(item.likes)} · 댓글 ${formatCompactNumber(item.comments)}`,
        post.url
      );
    }
  }

  return sendTelegramMessage(lines.join("\n"));
}

export function getTelegramEnvHelp() {
  return {
    TELEGRAM_BOT_TOKEN: "Telegram bot token from BotFather",
    TELEGRAM_CHAT_ID: "Target Telegram chat id"
  };
}
