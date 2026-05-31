import { NextResponse } from "next/server";
import {
  createPostComment,
  getPostComments,
  getPostStats
} from "../../../../../lib/blog-store";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const comments = await getPostComments(slug);
  const stats = await getPostStats(slug);

  return NextResponse.json({
    comments,
    stats
  });
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json();

  if (!body.nickname || !body.password || !body.content) {
    return NextResponse.json(
      { message: "nickname, password, content are required" },
      { status: 400 }
    );
  }

  const payload = await createPostComment(slug, body);

  return NextResponse.json(payload);
}
