"use client";

export default function ShareButton({
  title,
  path,
  className = "",
  label = "공유",
  iconOnly = false
}) {
  async function handleShare() {
    const url = typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    window.alert("링크를 복사했습니다.");
  }

  return (
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
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 12l8-8" />
        <path d="M10 4h6v6" />
        <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
      </svg>
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </button>
  );
}
