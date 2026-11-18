"use client";

import { useEffect, useState } from "react";

const commentDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul"
});

function applyPayload(slug, payload, setComments, setCommentCount) {
  setComments(payload.comments);
  setCommentCount(payload.stats.commentCount);
  window.dispatchEvent(
    new CustomEvent("blog-comments-changed", {
      detail: {
        slug,
        commentCount: payload.stats.commentCount
      }
    })
  );
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function formatCommentDate(value) {
  return commentDateFormatter.format(new Date(value));
}

function CommentForm({
  slug,
  parentId = null,
  onSubmitted,
  onCancel,
  submitLabel
}) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!nickname.trim() || !password.trim() || !content.trim()) {
      setError("닉네임, 비밀번호, 내용을 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          password,
          content: content.trim(),
          parentId
        })
      });

      if (!response.ok) {
        setError(await readErrorMessage(response, "댓글 저장에 실패했습니다."));
        return;
      }

      const payload = await response.json();

      setNickname("");
      setPassword("");
      setContent("");
      onSubmitted(payload);
    } catch {
      setError("댓글 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-grid">
        <input
          aria-label="닉네임"
          maxLength={50}
          required
          placeholder="닉네임"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        <input
          aria-label="댓글 비밀번호"
          minLength={4}
          maxLength={128}
          required
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <textarea
        aria-label="댓글 내용"
        maxLength={5000}
        required
        placeholder="댓글을 남겨 주세요."
        rows={parentId ? 3 : 5}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="comment-form-actions">
        <button className="solid-button" type="submit" disabled={submitting}>
          {submitting ? "저장 중..." : submitLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            취소
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentManageForm({
  mode,
  initialContent,
  onSubmit,
  onCancel
}) {
  const [password, setPassword] = useState("");
  const [content, setContent] = useState(initialContent || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    if (mode === "edit" && !content.trim()) {
      setError("수정할 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const nextError = await onSubmit({
      password,
      content: content.trim()
    });
    setSubmitting(false);

    if (nextError) {
      setError(nextError);
      return;
    }

    setPassword("");
    setContent(initialContent || "");
  }

  return (
    <form className="comment-manage-form" onSubmit={handleSubmit}>
      {mode === "edit" ? (
        <textarea
          rows={3}
          aria-label="수정할 댓글 내용"
          maxLength={5000}
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      ) : null}
      <input
        aria-label={mode === "admin-delete" ? "운영자 비밀번호" : "댓글 비밀번호"}
        maxLength={mode === "admin-delete" ? 256 : 128}
        required
        placeholder={mode === "admin-delete" ? "운영자 비밀번호" : "비밀번호"}
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="comment-form-actions">
        <button className="solid-button" type="submit" disabled={submitting}>
          {submitting
            ? "처리 중..."
            : mode === "edit"
              ? "수정 저장"
              : mode === "admin-delete"
                ? "관리 삭제"
                : "댓글 삭제"}
        </button>
        <button className="ghost-button" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

function CommentItem({ slug, comment, onSubmitted, canAdminDelete }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminDeleting, setAdminDeleting] = useState(false);

  async function handleEdit({ password, content }) {
    try {
      const response = await fetch(`/api/posts/${slug}/comments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commentId: comment.id,
          password,
          content
        })
      });

      if (response.status === 403) {
        return "비밀번호가 맞지 않습니다.";
      }

      if (!response.ok) {
        return await readErrorMessage(response, "댓글 수정에 실패했습니다.");
      }

      const payload = await response.json();
      setEditing(false);
      onSubmitted(payload);
      return null;
    } catch {
      return "댓글 수정에 실패했습니다.";
    }
  }

  async function handleDelete({ password }) {
    try {
      const response = await fetch(`/api/posts/${slug}/comments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commentId: comment.id,
          password
        })
      });

      if (response.status === 403) {
        return "비밀번호가 맞지 않습니다.";
      }

      if (!response.ok) {
        return await readErrorMessage(response, "댓글 삭제에 실패했습니다.");
      }

      const payload = await response.json();
      setDeleting(false);
      onSubmitted(payload);
      return null;
    } catch {
      return "댓글 삭제에 실패했습니다.";
    }
  }

  async function handleAdminDelete({ password }) {
    try {
      const response = await fetch(`/api/posts/${slug}/comments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commentId: comment.id,
          adminPassword: password
        })
      });

      if (response.status === 403) {
        return "운영자 비밀번호가 맞지 않습니다.";
      }

      if (!response.ok) {
        return await readErrorMessage(
          response,
          "운영자 삭제 처리에 실패했습니다."
        );
      }

      const payload = await response.json();
      setAdminDeleting(false);
      onSubmitted(payload);
      return null;
    } catch {
      return "운영자 삭제 처리에 실패했습니다.";
    }
  }

  return (
    <li className="comment-item">
      <article className="comment-bubble">
        <div className="comment-head">
          <strong>{comment.nickname}</strong>
          <span suppressHydrationWarning>{formatCommentDate(comment.createdAt)}</span>
        </div>
        <p>{comment.content}</p>
        <div className="comment-actions">
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setReplying((value) => !value);
              setEditing(false);
              setDeleting(false);
            }}
          >
            {replying ? "답글 닫기" : "답글 달기"}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setEditing((value) => !value);
              setReplying(false);
              setDeleting(false);
            }}
          >
            {editing ? "수정 닫기" : "수정"}
          </button>
          <button
            className="text-button text-button-danger"
            type="button"
            onClick={() => {
              setDeleting((value) => !value);
              setReplying(false);
              setEditing(false);
              setAdminDeleting(false);
            }}
          >
            {deleting ? "삭제 닫기" : "삭제"}
          </button>
          {canAdminDelete ? (
            <button
              className="text-button text-button-danger"
              type="button"
              onClick={() => {
                setAdminDeleting((value) => !value);
                setReplying(false);
                setEditing(false);
                setDeleting(false);
              }}
            >
              {adminDeleting ? "관리 삭제 닫기" : "관리 삭제"}
            </button>
          ) : null}
        </div>
      </article>

      {replying ? (
        <div className="reply-form-wrap">
          <CommentForm
            slug={slug}
            parentId={comment.id}
            submitLabel="답글 등록"
            onCancel={() => setReplying(false)}
            onSubmitted={(payload) => {
              setReplying(false);
              onSubmitted(payload);
            }}
          />
        </div>
      ) : null}

      {editing ? (
        <div className="reply-form-wrap">
          <CommentManageForm
            mode="edit"
            initialContent={comment.content}
            onCancel={() => setEditing(false)}
            onSubmit={handleEdit}
          />
        </div>
      ) : null}

      {deleting ? (
        <div className="reply-form-wrap">
          <CommentManageForm
            mode="delete"
            onCancel={() => setDeleting(false)}
            onSubmit={handleDelete}
          />
        </div>
      ) : null}

      {adminDeleting ? (
        <div className="reply-form-wrap">
          <CommentManageForm
            mode="admin-delete"
            onCancel={() => setAdminDeleting(false)}
            onSubmit={handleAdminDelete}
          />
        </div>
      ) : null}

      {comment.replies.length ? (
        <ul className="reply-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              slug={slug}
              comment={reply}
              onSubmitted={onSubmitted}
              canAdminDelete={canAdminDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function CommentsSection({
  slug,
  initialComments,
  initialCommentCount,
  initialUnavailable = false,
  canAdminDelete = false
}) {
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [unavailable, setUnavailable] = useState(initialUnavailable);
  const [retry, setRetry] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry deliberately re-runs the request after the user asks to retry.
  useEffect(() => {
    let isMounted = true;

    async function syncComments() {
      try {
        const response = await fetch(`/api/posts/${slug}/comments`, {
          cache: "no-store"
        });

        if (!response.ok) throw new Error("댓글 조회 실패");

        const payload = await response.json();

        if (!isMounted) {
          return;
        }

        setUnavailable(false);
        setComments(payload.comments);
        setCommentCount(payload.stats.commentCount);
      } catch {
        if (isMounted) setUnavailable(true);
      }
    }

    syncComments();

    return () => {
      isMounted = false;
    };
  }, [slug, retry]);

  function handleSubmitted(payload) {
    setUnavailable(false);
    applyPayload(slug, payload, setComments, setCommentCount);
  }

  return (
    <section className="comments-section">
      <div className="section-head">
        <h2>댓글</h2>
        <p>{unavailable ? "조회 불가" : `${commentCount}개`}</p>
      </div>

      {unavailable ? <p role="status" className="form-error">댓글을 불러오지 못했습니다. <button type="button" className="text-button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button></p> : null}
      <p className="comments-note">
        작성자는 비밀번호로 댓글을 수정·삭제할 수 있습니다.
        {canAdminDelete
          ? " 운영자는 별도 비밀번호로 관리 삭제할 수 있습니다."
          : ""}
      </p>

      <CommentForm
        slug={slug}
        submitLabel="댓글 등록"
        onSubmitted={handleSubmitted}
      />

      <ul className="comment-list">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            slug={slug}
            comment={comment}
            onSubmitted={handleSubmitted}
            canAdminDelete={canAdminDelete}
          />
        ))}
      </ul>
    </section>
  );
}
