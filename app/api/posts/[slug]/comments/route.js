import {
  createPostComment,
  deletePostCommentAsAdmin,
  deletePostComment,
  getPostComments,
  getPostStats,
  updatePostComment,
} from "../../../../../lib/blog-store";
import { notifyReplyComment } from "../../../../../lib/telegram";
import { safeEqual } from "../../../../../lib/passwords";
import {
  apiHandler,
  guardPost,
  readJson,
  textField,
  commentId,
  commentResponse,
  json,
  ApiError,
} from "../../../../../lib/api-security";

export const GET = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "read");
  return json({ comments: await getPostComments(slug), stats: await getPostStats(slug) });
});

export const POST = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "comment");
  const body = await readJson(request);
  const values = {
    nickname: textField(body, "nickname", 1, 50),
    password: textField(body, "password", 4, 128, false),
    content: textField(body, "content", 1, 5000),
    parentId: commentId(body.parentId, true),
  };
  const payload = await createPostComment(slug, values);
  if (!payload.error && values.parentId) {
    try {
      await notifyReplyComment({ slug, ...values });
    } catch {
      console.error("Failed to send reply notification");
    }
  }
  return commentResponse(payload);
});

export const PATCH = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "manage");
  const body = await readJson(request);
  return commentResponse(
    await updatePostComment(slug, {
      commentId: commentId(body.commentId),
      password: textField(body, "password", 1, 128, false),
      content: textField(body, "content", 1, 5000),
    }),
  );
});

export const DELETE = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "manage");
  const body = await readJson(request);
  const id = commentId(body.commentId);
  if (body.adminPassword !== undefined) {
    const password = textField(body, "adminPassword", 1, 256, false);
    if (
      !process.env.COMMENT_ADMIN_PASSWORD ||
      !safeEqual(password, process.env.COMMENT_ADMIN_PASSWORD)
    )
      throw new ApiError(403, "운영자 비밀번호가 맞지 않습니다.");
    return commentResponse(await deletePostCommentAsAdmin(slug, { commentId: id }));
  }
  return commentResponse(
    await deletePostComment(slug, {
      commentId: id,
      password: textField(body, "password", 1, 128, false),
    }),
  );
});
