import { getPostStats, setPostLike } from "../../../../../lib/blog-store";
import { notifyPostLike } from "../../../../../lib/telegram";
import {
  apiHandler,
  guardPost,
  visitor,
  withVisitor,
  readJson,
  json,
  ApiError,
} from "../../../../../lib/api-security";

export const GET = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "read");
  const identity = visitor(request, true);
  return withVisitor(json(await getPostStats(slug, identity.actor)), identity, request);
});

export const POST = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "like");
  const { actor } = visitor(request);
  const body = await readJson(request);
  if (typeof body.liked !== "boolean") throw new ApiError(400, "liked 값은 boolean이어야 합니다.");
  const { changed, ...stats } = await setPostLike(slug, body.liked, actor);
  if (changed && body.liked) {
    try {
      await notifyPostLike(slug, stats.likeCount);
    } catch {
      console.error("Failed to send like notification");
    }
  }
  return json(stats);
});
