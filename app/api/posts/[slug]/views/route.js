import { NextResponse } from "next/server";
import { incrementPostView } from "../../../../../lib/blog-store";
import { notifyPostVisit } from "../../../../../lib/telegram";

export async function POST(_request, { params }) {
  const { slug } = await params;
  const stats = await incrementPostView(slug);

  try {
    await notifyPostVisit(slug, stats.views);
  } catch (error) {
    console.error("Failed to send visit notification", error);
  }

  return NextResponse.json(stats);
}
