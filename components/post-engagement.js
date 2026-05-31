"use client";

import { useEffect, useMemo, useState } from "react";
import ShareButton from "./share-button";

export default function PostEngagement({
  slug,
  title,
  initialViews,
  initialLikeCount,
  initialCommentCount
}) {
  const [views, setViews] = useState(initialViews);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const storageKey = useMemo(() => `viewed:${slug}`, [slug]);
  const likeStorageKey = useMemo(() => `liked:${slug}`, [slug]);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function registerView() {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }

      const response = await fetch(`/api/posts/${slug}/views`, {
        method: "POST"
      });

      if (!response.ok) {
        return;
      }

      const stats = await response.json();

      sessionStorage.setItem(storageKey, "1");

      if (isMounted) {
        setViews(stats.views);
        setCommentCount(stats.commentCount);
      }
    }

    registerView();

    return () => {
      isMounted = false;
    };
  }, [slug, storageKey]);

  useEffect(() => {
    const storedLiked = localStorage.getItem(likeStorageKey) === "1";

    setLiked(storedLiked);
    if (storedLiked) {
      setLikeCount((value) => Math.max(value, initialLikeCount + 1));
    }
  }, [initialLikeCount, likeStorageKey]);

  useEffect(() => {
    function handleCommentChange(event) {
      if (event.detail.slug !== slug) {
        return;
      }

      setCommentCount(event.detail.commentCount);
    }

    window.addEventListener("blog-comments-changed", handleCommentChange);

    return () => {
      window.removeEventListener("blog-comments-changed", handleCommentChange);
    };
  }, [slug]);

  async function handleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((value) => Math.max(0, value + (nextLiked ? 1 : -1)));
    if (nextLiked) {
      localStorage.setItem(likeStorageKey, "1");
    } else {
      localStorage.removeItem(likeStorageKey);
    }

    try {
      const response = await fetch(`/api/posts/${slug}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          liked: nextLiked
        })
      });

      if (!response.ok) {
        throw new Error("like request failed");
      }

      const stats = await response.json();
      setLikeCount(stats.likeCount);
    } catch {
      // Vercel serverless runtime cannot persist our local JSON store reliably.
      // Keep the optimistic browser state instead of snapping back.
    }
  }

  return (
    <div className="engagement-bar">
      <div className="metric-row">
        <span>조회 {views}</span>
        <button
          className={`like-button ${liked ? "is-liked" : ""}`}
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          title="좋아요"
        >
          <span className="heart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.1 4.42 2.75 7.5 2.75c1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.35 5.5 5.5 0 3.84-3.4 6.99-8.55 11.76L12 21.35Z" />
            </svg>
          </span>
          <span>좋아요 {likeCount}</span>
        </button>
        <span>댓글 {commentCount}</span>
      </div>
      <ShareButton
        className="icon-button"
        title={title}
        path={`/blog/${slug}`}
        label="공유"
        iconOnly
      />
    </div>
  );
}
