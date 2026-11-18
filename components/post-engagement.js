"use client";

import { useEffect, useRef, useState } from "react";
import ShareButton from "./share-button";

export default function PostEngagement({
  slug,
  title,
  initialViews,
  initialLikeCount,
  initialCommentCount,
  statsUnavailable = false,
}) {
  const [stats, setStats] = useState({
    views: initialViews,
    likeCount: initialLikeCount,
    commentCount: initialCommentCount,
    liked: false,
  });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(statsUnavailable);
  const [retry, setRetry] = useState(0);
  const liking = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry deliberately re-runs the request after the user asks to retry.
  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      try {
        const bootstrap = await fetch(`/api/posts/${slug}/likes`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!bootstrap.ok) throw new Error("반응 정보를 불러오지 못했습니다.");
        const current = await bootstrap.json();
        if (controller.signal.aborted) return;
        setStats(current);
        setUnavailable(false);
        setReady(true);
        const response = await fetch(`/api/posts/${slug}/views`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("조회수를 저장하지 못했습니다.");
        const viewed = await response.json();
        // A view response must not overwrite a like changed in the meantime.
        if (!controller.signal.aborted) {
          setStats((value) => ({ ...value, views: viewed.views }));
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause.message || "반응 정보를 불러오지 못했습니다.");
      }
    }
    initialize();
    return () => controller.abort();
  }, [slug, retry]);

  useEffect(() => {
    function handleCommentChange(event) {
      if (event.detail.slug === slug)
        setStats((value) => ({ ...value, commentCount: event.detail.commentCount }));
    }
    window.addEventListener("blog-comments-changed", handleCommentChange);
    return () => window.removeEventListener("blog-comments-changed", handleCommentChange);
  }, [slug]);

  async function handleLike() {
    if (!ready || liking.current) return;
    liking.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${slug}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !stats.liked }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "좋아요를 저장하지 못했습니다.");
      setStats((value) => ({ ...value, likeCount: payload.likeCount, liked: payload.liked }));
    } catch (cause) {
      setError(cause.message || "좋아요를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      liking.current = false;
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="engagement-bar">
        <div className="metric-row">
          <span>조회 {unavailable ? "—" : stats.views}</span>
          <button
            className={`like-button ${stats.liked ? "is-liked" : ""}`}
            type="button"
            onClick={handleLike}
            aria-pressed={stats.liked}
            disabled={!ready || busy}
            title="좋아요"
          >
            <span className="heart-icon" aria-hidden="true">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.1 4.42 2.75 7.5 2.75c1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.35 5.5 5.5 0 3.84-3.4 6.99-8.55 11.76L12 21.35Z" />
              </svg>
            </span>
            <span>좋아요 {unavailable ? "—" : stats.likeCount}</span>
          </button>
          <span>댓글 {unavailable ? "—" : stats.commentCount}</span>
        </div>
        <ShareButton
          className="icon-button"
          title={title}
          path={`/blog/${slug}`}
          label="공유"
          iconOnly
        />
      </div>
      {error ? (
        <p role="status" className="form-error">
          {error}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            다시 불러오기
          </button>
        </p>
      ) : null}
    </div>
  );
}
