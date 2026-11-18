"use client";
import { useState } from "react";

export default function ShareButton({
  title,
  path,
  className = "",
  label = "공유",
  iconOnly = false,
}) {
  const [message, setMessage] = useState("");
  async function handleShare() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("링크를 복사했습니다.");
      }
    } catch (error) {
      if (error.name !== "AbortError")
        setMessage("공유하지 못했습니다. 주소창의 링크를 복사해 주세요.");
    }
  }
  return (
    <span>
      <button
        className={className}
        type="button"
        onClick={handleShare}
        aria-label={label}
        title={label}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 4h6v6" />
          <path d="M10 14 20 4" />
          <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
        </svg>
        {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </button>
      {message ? <span role="status">{message}</span> : null}
    </span>
  );
}
