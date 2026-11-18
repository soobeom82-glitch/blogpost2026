import {
  claimDailyReportDelivery,
  completeDailyReportDelivery,
  getDailyReportSummary,
  releaseDailyReportDelivery,
} from "../../../../lib/blog-store";
import { notifyDailyReport } from "../../../../lib/telegram";
import { apiHandler, json, ApiError } from "../../../../lib/api-security";
import { safeEqual } from "../../../../lib/passwords";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new ApiError(503, "리포트 인증 설정이 필요합니다.");
  if (!safeEqual(request.headers.get("authorization") || "", `Bearer ${secret}`))
    throw new ApiError(401, "인증이 필요합니다.");
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const summary = await getDailyReportSummary(1);
  // Preview never sends a message and never claims the scheduled delivery.
  if (preview) return json({ ok: true, preview: true, summary });
  const token = await claimDailyReportDelivery(summary.dateKey);
  if (!token) return json({ ok: true, alreadySentOrInProgress: true, dateKey: summary.dateKey });
  try {
    const sent = await notifyDailyReport(summary);
    if (!sent) throw new ApiError(503, "Telegram 설정이 필요합니다.");
    await completeDailyReportDelivery(summary.dateKey, token);
  } catch (error) {
    await releaseDailyReportDelivery(summary.dateKey, token);
    throw error;
  }
  return json({ ok: true, dateKey: summary.dateKey, summary });
});
