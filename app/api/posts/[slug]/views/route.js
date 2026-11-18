import { incrementPostView } from "../../../../../lib/blog-store";
import { notifyPostVisit } from "../../../../../lib/telegram";
import { apiHandler, guardPost, visitor, json } from "../../../../../lib/api-security";

export const POST = apiHandler(async (request, context) => {
  const slug = await guardPost(request, context, "view");
  const { actor } = visitor(request);
  const { changed, ...stats } = await incrementPostView(slug, actor);
  if (changed) {
    try {
      await notifyPostVisit(slug, stats.views);
    } catch {
      console.error("Failed to send visit notification");
    }
  }
  return json(stats);
});
