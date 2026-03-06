"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CommentItem from "../../../components/CommentItem.jsx";
import { buildCloudinaryOptimizedUrl } from "../../../lib/image.js";
import { readPostSeed, savePostSeed } from "../../../lib/post-seed.js";

const ADMIN_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_NAME = "\uC775\uBA85";
const AD_IMAGE_SRC = "/ads/post-detail-ad.png";
const AD_IMAGE_ALT = "\uAC8C\uC2DC\uAE00 \uC0C1\uC138 \uAD11\uACE0";

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "\uBC29\uAE08 \uC804";
  if (diff < 3600) return `${Math.floor(diff / 60)}\uBD84 \uC804`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}\uC2DC\uAC04 \uC804`;
  if (diff < 172800) return "\uC5B4\uC81C";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

const PersonIcon = ({ size = 18, color = "#a0aec0" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const SendIcon = ({ color = "#1b4797" }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const HeartIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill={active ? "#ff4d7e" : "none"}
    stroke={active ? "#ff4d7e" : "#b8bcc4"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b8bcc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill={active ? "#4f79d7" : "none"}
    stroke={active ? "#4f79d7" : "#b8bcc4"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

function getSeededPost(postId) {
  const seeded = readPostSeed(postId);
  if (!seeded) return null;

  return {
    ...seeded,
    images: Array.isArray(seeded.images) ? seeded.images : [],
    poll: seeded.poll || null,
  };
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const commentsAnchorRef = useRef(null);
  const commentIdempotencyKeyRef = useRef("");
  const initialSeedRef = useRef(getSeededPost(id));

  const [post, setPost] = useState(initialSeedRef.current);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(!initialSeedRef.current);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [poll, setPoll] = useState(initialSeedRef.current?.poll || null);
  const [voting, setVoting] = useState(false);
  const [adImageError, setAdImageError] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [entered, setEntered] = useState(false);

  function createIdempotencyKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function invalidateCommentKey() {
    commentIdempotencyKeyRef.current = "";
  }

  async function fetchPost({ keepVisible = false } = {}) {
    if (!keepVisible) {
      setLoading(true);
    }

    const response = await fetch("/api/posts/" + id);
    if (!response.ok) {
      setLoading(false);
      return;
    }

    const data = await response.json();
    setPost(data.post);
    savePostSeed(data.post);
    setPoll(data.post?.poll || null);
    if (data.post?.isNotice) {
      setComments([]);
    } else {
      fetchComments();
    }
    setLoading(false);
  }

  async function fetchComments() {
    const response = await fetch("/api/comments?postId=" + id);
    if (!response.ok) return;
    const data = await response.json();
    setComments(data.comments || []);
  }

  async function checkBookmark() {
    try {
      const response = await fetch("/api/bookmarks");
      if (!response.ok) return;
      const data = await response.json();
      setBookmarked((data.posts || []).some((item) => item.id === parseInt(id, 10)));
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const seededPost = getSeededPost(id);
    if (seededPost) {
      setPost(seededPost);
      setPoll(seededPost.poll || null);
      setLoading(false);
    } else {
      setPost(null);
      setPoll(null);
      setLoading(true);
    }

    invalidateCommentKey();
    setCommentSubmitting(false);
    fetchPost({ keepVisible: !!seededPost });
    checkBookmark();
  }, [id]);

  useEffect(() => {
    setEntered(false);
    const timer = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(timer);
  }, [id]);

  async function handleLikePost() {
    const response = await fetch("/api/posts/" + id + "/like", { method: "POST" });
    if (!response.ok) return;
    const data = await response.json();
    setPost((prev) =>
      prev
        ? {
            ...prev,
            alreadyLiked: data.liked,
            likeCount: data.likeCount,
          }
        : prev,
    );
  }

  async function handleDeletePost() {
    if (!confirm("\uC815\uB9D0 \uAC8C\uC2DC\uAE00\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
    const response = await fetch("/api/posts/" + id, { method: "DELETE" });
    if (response.ok) router.push("/");
  }

  async function handleReportPost() {
    const response = await fetch("/api/posts/" + id + "/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "\uBD80\uC801\uC808\uD55C \uB0B4\uC6A9" }),
    });
    if (response.ok) alert("\uC2E0\uACE0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    setShowMenu(false);
  }

  async function handleBookmark() {
    const response = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: parseInt(id, 10) }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setBookmarked(data.bookmarked);
  }

  async function handleBlockPostAuthor() {
    if (!post?.userId) return;
    if (!confirm("\uC774 \uC0AC\uC6A9\uC790\uB97C \uCC28\uB2E8\uD560\uAE4C\uC694?")) return;
    const response = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: post.userId }),
    });
    if (response.ok) {
      alert("\uCC28\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
      router.push("/");
    }
    setShowMenu(false);
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post?.title || "", url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert("\uB9C1\uD06C\uAC00 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."));
    }
    setShowMenu(false);
  }

  async function handleCommentSubmit() {
    const normalizedComment = commentText.trim();
    if (!normalizedComment || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const idempotencyKey =
        commentIdempotencyKeyRef.current || createIdempotencyKey();
      commentIdempotencyKeyRef.current = idempotencyKey;

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          postId: parseInt(id, 10),
          parentId: replyTo,
          content: normalizedComment,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status < 500) {
          invalidateCommentKey();
        }
        alert(data.error || "\uB313\uAE00 \uC791\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }

      invalidateCommentKey();
      setCommentText("");
      setReplyTo(null);
      fetchComments();
      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: prev.commentCount + 1,
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      alert("\uB313\uAE00 \uC791\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleCommentLike(commentId) {
    const response = await fetch("/api/comments/" + commentId + "/like", { method: "POST" });
    if (response.ok) fetchComments();
  }

  async function handleCommentReport(commentId) {
    const response = await fetch("/api/comments/" + commentId + "/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "\uBD80\uC801\uC808\uD55C \uB0B4\uC6A9" }),
    });
    if (response.ok) alert("\uC2E0\uACE0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  }

  async function handleCommentDelete(commentId) {
    if (!confirm("\uB313\uAE00\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
    const response = await fetch("/api/comments?id=" + commentId, { method: "DELETE" });
    if (!response.ok) return;
    fetchComments();
    setPost((prev) =>
      prev
        ? {
            ...prev,
            commentCount: Math.max(prev.commentCount - 1, 0),
          }
        : prev,
    );
  }

  async function handleCommentBlock(userId) {
    if (!confirm("\uC774 \uC0AC\uC6A9\uC790\uB97C \uCC28\uB2E8\uD560\uAE4C\uC694?")) return;
    const response = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      alert("\uCC28\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
      fetchComments();
    }
  }

  async function handleVote(optionId) {
    if (voting || !poll || poll.votedOptionId) return;
    setVoting(true);
    try {
      const response = await fetch("/api/posts/" + id + "/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "\uD22C\uD45C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      } else {
        setPoll((prev) => ({
          ...prev,
          votedOptionId: data.votedOptionId,
          options: data.options,
          totalVotes: data.totalVotes,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("\uD22C\uD45C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setVoting(false);
  }

  function handleBack() {
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }

    if (searchParams.get("from") === "home") {
      sessionStorage.setItem("lounge-home-feed-return-v1", "1");
      router.push("/", { scroll: false });
      return;
    }

    if (window.history.length <= 1) {
      router.push("/");
      return;
    }

    router.back();
  }

  if (loading && !post) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "480px",
          height: "100dvh",
          background: "#fff",
          zIndex: 100,
        }}
      />
    );
  }
  if (!post) return <div className="empty">{"\uAC8C\uC2DC\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>;

  const parentComments = comments.filter((comment) => !comment.parentId);
  const childComments = comments.filter((comment) => comment.parentId);
  const displayAuthor = post.author === ADMIN_NAME ? ADMIN_NAME : ANON_NAME;
  const commentInputPlaceholder = replyTo ? "\uB2F5\uAE00\uC744 \uC785\uB825\uD558\uC138\uC694." : "\uB313\uAE00\uC744 \uC785\uB825\uD558\uC138\uC694.";
  const canShowAdImage = !!AD_IMAGE_SRC && !adImageError;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: entered ? "translateX(-50%)" : "translateX(calc(-50% + 44px))",
        width: "100%",
        maxWidth: "480px",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        zIndex: 100,
        opacity: entered ? 1 : 0.98,
        transition: "transform 230ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease",
        willChange: "transform",
      }}
    >
      <div className="top-bar" style={{ flexShrink: 0, justifyContent: "space-between" }}>
        <button className="top-bar-back" onClick={handleBack} data-testid="post-detail-back">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#222" }}>
            {"\uC790\uC720\uAC8C\uC2DC\uD310"}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
            {"\uC5FC\uAD11\uC0AC \uB77C\uC6B4\uC9C0"}
          </div>
        </div>

        <div className="top-bar-right" style={{ marginLeft: 0, gap: 10, position: "relative" }}>
          <button className="top-bar-btn" onClick={handleShare}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button className="top-bar-btn" onClick={() => setShowMenu((prev) => !prev)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#666">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div className="dropdown-menu" style={{ right: 0 }}>
              {(post.isAuthor || post.isAdmin) && (
                <div className="dropdown-item danger" onClick={handleDeletePost}>
                  {"\uC0AD\uC81C"}
                </div>
              )}
              <div className="dropdown-item" onClick={handleReportPost}>
                {"\uC2E0\uACE0"}
              </div>
              {!post.isAuthor && (
                <div className="dropdown-item" onClick={handleBlockPostAuthor}>
                  {"\uC0AC\uC6A9\uC790 \uCC28\uB2E8"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          background: "#fff",
        }}
      >
        <section style={{ padding: "16px 16px 12px", borderBottom: "1px solid #efefef" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              className={"post-card-avatar" + (displayAuthor === ADMIN_NAME ? " admin" : "")}
              style={{ width: 42, height: 42 }}
            >
              <PersonIcon />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: displayAuthor === ADMIN_NAME ? "#1b4797" : "#222" }}>
                {displayAuthor}
              </div>
              <div style={{ fontSize: 13, color: "#8e8e8e" }}>{formatDateTime(post.createdAt)}</div>
            </div>
          </div>

          <h1 style={{ fontSize: 42 / 2, lineHeight: 1.35, color: "#1f2329", margin: "0 0 10px", fontWeight: 800 }}>
            {post.title}
          </h1>
          <div style={{ fontSize: 17, lineHeight: 1.6, color: "#333", whiteSpace: "pre-wrap" }}>{post.content}</div>
        </section>

        {post.images && post.images.length > 0 && (
          <section style={{ padding: "12px 16px 16px", borderBottom: "1px solid #f1f1f1" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {post.images.map((url, idx) => (
                <img
                  key={idx}
                  src={buildCloudinaryOptimizedUrl(url, {
                    width: 1200,
                    height: 1200,
                    crop: "limit",
                  })}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", borderRadius: 10, display: "block", border: "1px solid #f0f0f0" }}
                />
              ))}
            </div>
          </section>
        )}

        {poll && (
          <section
            style={{
              margin: "12px 16px",
              borderRadius: 12,
              border: "1px solid #e8edf5",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", background: "#f0f4ff" }}>
              <div style={{ fontSize: 13, color: "#1b4797", fontWeight: 700, marginBottom: 4 }}>
                {"\uD22C\uD45C"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{poll.question}</div>
              <div style={{ fontSize: 12, color: "#8f96a1", marginTop: 4 }}>{`${poll.totalVotes}\uBA85 \uCC38\uC5EC`}</div>
            </div>

            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {poll.options.map((option) => {
                const voted = poll.votedOptionId === option.id;
                const showResult = !!poll.votedOptionId;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={showResult || voting}
                    style={{
                      position: "relative",
                      width: "100%",
                      padding: "10px 14px",
                      border: voted ? "2px solid #1b4797" : "1px solid #e0e0e0",
                      borderRadius: 8,
                      background: "#fff",
                      textAlign: "left",
                      cursor: showResult ? "default" : "pointer",
                      overflow: "hidden",
                    }}
                  >
                    {showResult && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${option.percent}%`,
                          background: voted ? "#e8edf5" : "#f5f5f5",
                          transition: "width 0.35s ease",
                        }}
                      />
                    )}
                    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: voted ? "#1b4797" : "#333", fontWeight: voted ? 700 : 500 }}>
                        {voted ? "\u2713 " : ""}
                        {option.text}
                      </span>
                      {showResult && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: voted ? "#1b4797" : "#8f96a1" }}>
                          {option.percent}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section style={{ borderTop: "1px solid #efefef", borderBottom: "1px solid #efefef", background: "#fff" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: post.isNotice ? "1fr 1fr" : "1fr 1fr 1fr",
              height: 56,
            }}
          >
            <button
              onClick={handleLikePost}
              style={{
                border: "none",
                background: "none",
                borderRight: "1px solid #efefef",
                color: post.alreadyLiked ? "#ff4d7e" : "#8c8c8c",
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <HeartIcon active={post.alreadyLiked} />
              {`\uC88B\uC544\uC694 ${post.likeCount}`}
            </button>
            {!post.isNotice && (
              <button
                onClick={() => commentsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                style={{
                  border: "none",
                  background: "none",
                  borderRight: "1px solid #efefef",
                  color: "#8c8c8c",
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CommentIcon />
                {`\uB313\uAE00 ${post.commentCount}`}
              </button>
            )}
            <button
              onClick={handleBookmark}
              style={{
                border: "none",
                background: "none",
                color: bookmarked ? "#4f79d7" : "#8c8c8c",
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <BookmarkIcon active={bookmarked} />
              {"\uC2A4\uD06C\uB7A9"}
            </button>
          </div>
        </section>

        <section style={{ background: "#f5f6f8", padding: "10px 16px 14px", borderBottom: "8px solid #f2f3f5" }}>
          <div style={{ fontSize: 11, color: "#8f8f8f", marginBottom: 6 }}>
            {"\uAD11\uACE0"}
          </div>

          {canShowAdImage ? (
            <img
              src={AD_IMAGE_SRC}
              alt={AD_IMAGE_ALT}
              onError={() => setAdImageError(true)}
              style={{
                width: "100%",
                aspectRatio: "4 / 1",
                objectFit: "cover",
                borderRadius: 10,
                display: "block",
                background: "#edf1f7",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 1",
                borderRadius: 10,
                border: "1px dashed #cfd4dc",
                background: "#fafbfd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#8f96a1",
                fontSize: 12,
                lineHeight: 1.5,
                padding: "8px 10px",
              }}
            >
              {"\uAD11\uACE0 \uC774\uBBF8\uC9C0 \uC0BD\uC785 \uC601\uC5ED (1200 x 300 PNG)"}
            </div>
          )}
        </section>

        {!post.isNotice && (
          <section ref={commentsAnchorRef} className="comment-section">
            <div className="comment-count">{`\uB313\uAE00 ${comments.length}`}</div>

            {parentComments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  onLike={handleCommentLike}
                  onReport={handleCommentReport}
                  onReply={(commentId) => {
                    invalidateCommentKey();
                    setReplyTo(commentId);
                  }}
                  onDelete={handleCommentDelete}
                  onBlock={handleCommentBlock}
                />

                {childComments
                  .filter((item) => item.parentId === comment.id)
                  .map((child) => (
                    <CommentItem
                      key={child.id}
                      comment={child}
                      onLike={handleCommentLike}
                      onReport={handleCommentReport}
                      onReply={() => {}}
                      onDelete={handleCommentDelete}
                      onBlock={handleCommentBlock}
                    />
                  ))}
              </div>
            ))}

            {comments.length === 0 && <div className="empty">{"\uB4F1\uB85D\uB41C \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>}
          </section>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid #e9ecf1",
          background: "#fff",
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        }}
      >
        {post.isNotice ? (
          <div
            style={{
              padding: "14px 16px",
              textAlign: "center",
              color: "#8e97a3",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {"\uACF5\uC9C0 \uAC8C\uC2DC\uBB3C\uC740 \uB313\uAE00 \uAE30\uB2A5\uC774 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4."}
          </div>
        ) : (
          <>
            {replyTo && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 14px",
                  background: "#f0f4ff",
                  color: "#1b4797",
                  fontSize: 12,
                }}
              >
                <span>{"\uB2F5\uAE00 \uC791\uC131 \uC911"}</span>
                <button
                  onClick={() => {
                    invalidateCommentKey();
                    setReplyTo(null);
                  }}
                  style={{ border: "none", background: "none", color: "#9097a3" }}
                >
                  {"\uCDE8\uC18C"}
                </button>
              </div>
            )}

            <div style={{ padding: "10px 12px" }}>
              <div
                style={{
                  height: 52,
                  borderRadius: 16,
                  border: "1px solid #e2e5eb",
                  background: "#f7f8fa",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px 0 12px",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: "#e53935", flexShrink: 0 }}>
                  {"\uC775\uBA85"}
                </span>
                <input
                  data-testid="comment-input"
                  value={commentText}
                  onChange={(event) => {
                    invalidateCommentKey();
                    setCommentText(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !commentSubmitting) handleCommentSubmit();
                  }}
                  placeholder={commentInputPlaceholder}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 16,
                    color: "#333",
                  }}
                />
                <button
                  data-testid="comment-submit"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || commentSubmitting}
                  style={{
                    border: "none",
                    background: "none",
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: commentText.trim() && !commentSubmitting ? 1 : 0.4,
                  }}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
