"use client";

import { useEffect, useMemo, useState } from "react";
import ShareButton from "./share-button";

export default function PostEngagement({
  slug,
  title,
  initialViews,
  initialCommentCount
}) {
  const [views, setViews] = useState(initialViews);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const storageKey = useMemo(() => `viewed:${slug}`, [slug]);

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

  return (
    <div className="engagement-bar">
      <div className="metric-row">
        <span>조회 {views}</span>
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
