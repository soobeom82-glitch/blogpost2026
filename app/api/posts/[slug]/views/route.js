import { NextResponse } from "next/server";
import { incrementPostView } from "../../../../../lib/blog-store";

export async function POST(_request, { params }) {
  const { slug } = await params;
  const stats = await incrementPostView(slug);

  return NextResponse.json(stats);
}
