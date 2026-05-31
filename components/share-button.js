"use client";

export default function ShareButton({
  title,
  path,
  className = "",
  label = "공유"
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
    <button className={className} type="button" onClick={handleShare}>
      {label}
    </button>
  );
}
