import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { allPosts } from "../content/posts/index.js";
import { consumeRateLimit } from "./blog-store.js";
import { safeEqual } from "./passwords.js";

const COOKIE_NAME = "blog_visitor";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ApiError extends Error {
  constructor(status, message, headers = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

export function json(value, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiHandler(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (!(error instanceof ApiError))
        console.error("Blog API unavailable", { code: error.code || error.name });
      return NextResponse.json(
        {
          message:
            error instanceof ApiError
              ? error.message
              : "일시적으로 저장소에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        },
        {
          status: error instanceof ApiError ? error.status : 503,
          headers: { "Cache-Control": "no-store", ...(error.headers || {}) },
        },
      );
    }
  };
}

function secret() {
  const value = process.env.ENGAGEMENT_SECRET;
  if (value?.length >= 32) return value;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL)
    throw new ApiError(503, "참여 기능 설정이 필요합니다.");
  return "local-development-only-not-for-deployment";
}

function signature(value) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function visitor(request, create = false) {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const [id, signed] = (raw || "").split(".");
  if (UUID.test(id || "") && signed && safeEqual(signature(id), signed)) return { actor: id };
  if (!create)
    throw new ApiError(409, "방문 정보를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.");
  const actor = randomUUID();
  return { actor, cookie: `${actor}.${signature(actor)}` };
}

export function withVisitor(response, identity, request) {
  if (identity.cookie)
    response.cookies.set(COOKIE_NAME, identity.cookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      maxAge: 365 * 86400,
      path: "/",
    });
  return response;
}

export async function guardPost(request, context, action) {
  const { slug } = await context.params;
  if (!allPosts.some((post) => post.slug === slug))
    throw new ApiError(404, "글을 찾을 수 없습니다.");
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    // Next may reconstruct request.url with an internal hostname. Compare against
    // the actual HTTP Host, which browsers cannot override in cross-origin fetches.
    const requestUrl = new URL(request.url);
    const expectedOrigin = new URL(
      `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`,
    ).origin;
    if (
      !origin ||
      origin !== expectedOrigin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new ApiError(403, "허용되지 않은 요청입니다.");
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
      throw new ApiError(415, "JSON 요청이 필요합니다.");
  }
  // Vercel overwrites this header at its trusted ingress. Never trust arbitrary X-Forwarded-For.
  // Self-hosted deployments share a conservative bucket unless a trusted ingress is added.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local";
  const limits = {
    read: [120, 60000],
    view: [120, 60000],
    like: [30, 60000],
    comment: [10, 600000],
    manage: [20, 600000],
  };
  const [limit, windowMs] = limits[action];
  const key = signature(`${action}:${address}`);
  const result = await consumeRateLimit(key, limit, windowMs);
  if (!result.allowed)
    throw new ApiError(429, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", {
      "Retry-After": String(result.retryAfter),
    });
  return slug;
}

export async function readJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "요청 내용이 필요합니다.");
  const chunks = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 32768) {
      await reader.cancel();
      throw new ApiError(413, "요청 내용이 너무 깁니다.");
    }
    chunks.push(Buffer.from(value));
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    return body;
  } catch {
    throw new ApiError(400, "올바른 JSON 객체가 필요합니다.");
  }
}

export function textField(body, key, min, max, trim = true) {
  if (typeof body[key] !== "string") throw new ApiError(400, `${key} 입력을 확인해 주세요.`);
  const value = trim ? body[key].trim() : body[key];
  if (value.length < min || value.length > max || !value.trim())
    throw new ApiError(400, `${key}은(는) ${min}~${max}자로 입력해 주세요.`);
  return value;
}

export function commentId(value, optional = false) {
  if (optional && (value === undefined || value === null)) return null;
  if (typeof value !== "string" || !UUID.test(value))
    throw new ApiError(400, "댓글 번호를 확인해 주세요.");
  return value;
}

export function commentResponse(payload) {
  const errors = {
    not_found: [404, "댓글을 찾을 수 없습니다."],
    invalid_password: [403, "비밀번호가 맞지 않습니다."],
    invalid_parent: [400, "답글을 달 수 없는 댓글입니다."],
  };
  if (payload.error) throw new ApiError(...errors[payload.error]);
  return json(payload);
}
