import { NextResponse } from "next/server";
import { getPostStats, setPostLike } from "../../../../../lib/blog-store";
import { notifyPostLike } from "../../../../../lib/telegram";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const stats = await getPostStats(slug);

  return NextResponse.json(stats);
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json();

  if (typeof body.liked !== "boolean") {
    return NextResponse.json(
      { message: "liked must be boolean" },
      { status: 400 }
    );
  }

  const stats = await setPostLike(slug, body.liked);

  if (body.liked) {
    try {
      await notifyPostLike(slug, stats.likeCount);
    } catch (error) {
      console.error("Failed to send like notification", error);
    }
  }

  return NextResponse.json(stats);
}
