import { NextResponse } from "next/server";
import {
  createPostComment,
  deletePostComment,
  getPostComments,
  getPostStats,
  updatePostComment
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

export async function PATCH(request, { params }) {
  const { slug } = await params;
  const body = await request.json();

  if (!body.commentId || !body.password || !body.content) {
    return NextResponse.json(
      { message: "commentId, password, content are required" },
      { status: 400 }
    );
  }

  const payload = await updatePostComment(slug, body);

  if (payload.error === "not_found") {
    return NextResponse.json(
      { message: "comment not found" },
      { status: 404 }
    );
  }

  if (payload.error === "invalid_password") {
    return NextResponse.json(
      { message: "invalid password" },
      { status: 403 }
    );
  }

  return NextResponse.json(payload);
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  const body = await request.json();

  if (!body.commentId || !body.password) {
    return NextResponse.json(
      { message: "commentId and password are required" },
      { status: 400 }
    );
  }

  const payload = await deletePostComment(slug, body);

  if (payload.error === "not_found") {
    return NextResponse.json(
      { message: "comment not found" },
      { status: 404 }
    );
  }

  if (payload.error === "invalid_password") {
    return NextResponse.json(
      { message: "invalid password" },
      { status: 403 }
    );
  }

  return NextResponse.json(payload);
}
