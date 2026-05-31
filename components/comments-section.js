"use client";

import { useState } from "react";

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

    const response = await fetch(`/api/posts/${slug}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nickname: nickname.trim(),
        password: password.trim(),
        content: content.trim(),
        parentId
      })
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("댓글 저장에 실패했습니다.");
      return;
    }

    const payload = await response.json();

    setNickname("");
    setPassword("");
    setContent("");
    onSubmitted(payload);
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-grid">
        <input
          placeholder="닉네임"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        <input
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <textarea
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
      password: password.trim(),
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
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      ) : null}
      <input
        placeholder="비밀번호"
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
              : "댓글 삭제"}
        </button>
        <button className="ghost-button" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

function CommentItem({ slug, comment, onSubmitted }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleEdit({ password, content }) {
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
      return "댓글 수정에 실패했습니다.";
    }

    const payload = await response.json();
    setEditing(false);
    onSubmitted(payload);
    return null;
  }

  async function handleDelete({ password }) {
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
      return "댓글 삭제에 실패했습니다.";
    }

    const payload = await response.json();
    setDeleting(false);
    onSubmitted(payload);
    return null;
  }

  return (
    <li className="comment-item">
      <article className="comment-bubble">
        <div className="comment-head">
          <strong>{comment.nickname}</strong>
          <span>{new Date(comment.createdAt).toLocaleString("ko-KR")}</span>
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
            }}
          >
            {deleting ? "삭제 닫기" : "삭제"}
          </button>
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

      {comment.replies.length ? (
        <ul className="reply-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              slug={slug}
              comment={reply}
              onSubmitted={onSubmitted}
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
  initialCommentCount
}) {
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  function handleSubmitted(payload) {
    applyPayload(slug, payload, setComments, setCommentCount);
  }

  return (
    <section className="comments-section">
      <div className="section-head">
        <h2>댓글</h2>
        <p>{commentCount}개</p>
      </div>

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
          />
        ))}
      </ul>
    </section>
  );
}
