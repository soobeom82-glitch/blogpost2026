import { NextResponse } from "next/server";
import { getPostStats, setPostLike } from "../../../../../lib/blog-store";

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
  return NextResponse.json(stats);
}
