import { NextResponse } from "next/server";
import {
  claimDailyReportDelivery,
  getDailyReportSummary,
  releaseDailyReportDelivery
} from "../../../../lib/blog-store";
import { notifyDailyReport } from "../../../../lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview") === "1";
  const summary = await getDailyReportSummary(1);

  if (!preview) {
    const claimed = await claimDailyReportDelivery(summary.dateKey);

    if (!claimed) {
      return NextResponse.json({
        ok: true,
        alreadySent: true,
        dateKey: summary.dateKey,
        summary
      });
    }
  }

  try {
    const sent = await notifyDailyReport(summary, { preview });

    if (!sent) {
      if (!preview) {
        await releaseDailyReportDelivery(summary.dateKey);
      }

      return NextResponse.json(
        {
          ok: false,
          message: "Telegram is not configured",
          preview,
          dateKey: summary.dateKey
        },
        { status: 503 }
      );
    }
  } catch (error) {
    if (!preview) {
      await releaseDailyReportDelivery(summary.dateKey);
    }

    console.error("Failed to send daily report", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to send daily report",
        error: error.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    preview,
    dateKey: summary.dateKey,
    summary
  });
}
