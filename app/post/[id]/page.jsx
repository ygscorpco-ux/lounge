"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import CommentItem from "../../../components/CommentItem.jsx";

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 172800) return "어제";
  return date.getMonth() + 1 + "/" + date.getDate();
}

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#a0aec0">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [poll, setPoll] = useState(null); // 투표 데이터
  const [voting, setVoting] = useState(false); // 투표 처리 중
  const router = useRouter();

  async function fetchPost() {
    const r = await fetch("/api/posts/" + id);
    if (r.ok) {
      const d = await r.json();
      setPost(d.post);
      if (d.post.poll) setPoll(d.post.poll); // 투표 데이터 별도 상태로 관리
    }
    setLoading(false);
  }
  async function fetchComments() {
    const r = await fetch("/api/comments?postId=" + id);
    if (r.ok) {
      const d = await r.json();
      setComments(d.comments || []);
    }
  }
  async function checkBookmark() {
    try {
      const r = await fetch("/api/bookmarks");
      if (r.ok) {
        const d = await r.json();
        setBookmarked((d.posts || []).some((p) => p.id === parseInt(id)));
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchPost();
    fetchComments();
    checkBookmark();
  }, [id]);

  async function handleLikePost() {
    const r = await fetch("/api/posts/" + id + "/like", { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setPost((p) =>
        p ? { ...p, alreadyLiked: d.liked, likeCount: d.likeCount } : p,
      );
    }
  }
  async function handleDeletePost() {
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    const r = await fetch("/api/posts/" + id, { method: "DELETE" });
    if (r.ok) router.push("/");
  }
  async function handleReport() {
    const r = await fetch("/api/posts/" + id + "/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "부적절한 내용" }),
    });
    if (r.ok) alert("신고 완료");
    setShowMenu(false);
  }
  async function handleBookmark() {
    const r = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: parseInt(id) }),
    });
    if (r.ok) {
      const d = await r.json();
      setBookmarked(d.bookmarked);
    }
  }
  async function handleBlockUser() {
    if (!post) return;
    if (!confirm("이 사용자의 글을 앞으로 숨기시겠습니까?")) return;
    const r = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: post.userId }),
    });
    if (r.ok) {
      alert("차단 완료");
      router.push("/");
    }
    setShowMenu(false);
  }
  function handleShare() {
    const u = window.location.href;
    if (navigator.share) navigator.share({ title: post.title, url: u });
    else
      navigator.clipboard
        .writeText(u)
        .then(() => alert("링크가 복사되었습니다"));
    setShowMenu(false);
  }

  async function handleCommentSubmit() {
    if (!commentText.trim()) return;
    const r = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: parseInt(id),
        parentId: replyTo,
        content: commentText,
      }),
    });
    if (r.ok) {
      setCommentText("");
      setReplyTo(null);
      fetchComments();
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
    }
  }
  async function handleCommentLike(cid) {
    const r = await fetch("/api/comments/" + cid + "/like", { method: "POST" });
    if (r.ok) fetchComments();
  }
  async function handleCommentReport(cid) {
    const r = await fetch("/api/comments/" + cid + "/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "부적절한 내용" }),
    });
    if (r.ok) alert("신고 완료");
  }
  async function handleCommentDelete(cid) {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;
    const r = await fetch("/api/comments?id=" + cid, { method: "DELETE" });
    if (r.ok) {
      fetchComments();
      setPost((p) =>
        p ? { ...p, commentCount: Math.max(p.commentCount - 1, 0) } : p,
      );
    }
  }
  async function handleCommentBlock(uid) {
    if (!confirm("이 사용자의 글을 앞으로 숨기시겠습니까?")) return;
    const r = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid }),
    });
    if (r.ok) {
      alert("차단 완료");
      fetchComments();
    }
  }

  // 투표 참여 처리
  async function handleVote(optionId) {
    if (voting || !poll || poll.votedOptionId) return;
    setVoting(true);
    try {
      const r = await fetch("/api/posts/" + id + "/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const d = await r.json();
      if (r.ok) {
        // 투표 결과 즉시 반영 (페이지 새로고침 없이)
        setPoll((prev) => ({
          ...prev,
          votedOptionId: d.votedOptionId,
          options: d.options,
          totalVotes: d.totalVotes,
        }));
      } else {
        alert(d.error || "투표 실패");
      }
    } catch (e) {
      alert("투표 중 오류 발생");
    }
    setVoting(false);
  }

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!post) return <div className="empty">글을 찾을 수 없습니다</div>;

  const isAdmin = post.author === "염광사";
  const parentComments = comments.filter((c) => !c.parentId);
  const childComments = comments.filter((c) => c.parentId);

  return (
    /* position:fixed + flex column 구조 — 댓글 입력창이 항상 하단 고정 (iOS Safari 완벽 대응) */
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        zIndex: 100,
      }}
    >
      {/* 상단 탑바 — 고정 */}
      <div className="top-bar" style={{ position: "relative", flexShrink: 0 }}>
        <button className="top-bar-back" onClick={() => router.push("/")}>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="top-bar-title">게시글</span>
        <div className="top-bar-right" style={{ position: "relative" }}>
          <button className="top-bar-btn" onClick={handleBookmark}>
            {bookmarked ? "★" : "☆"}
          </button>
          <button className="top-bar-btn" onClick={handleShare}>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button
            className="top-bar-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#555">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              {(post.isAuthor || post.isAdmin) && (
                <div
                  className="dropdown-item danger"
                  onClick={handleDeletePost}
                >
                  삭제
                </div>
              )}
              <div className="dropdown-item" onClick={handleReport}>
                신고
              </div>
              {!post.isAuthor && (
                <div className="dropdown-item" onClick={handleBlockUser}>
                  이 사용자 차단
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 스크롤 영역 — 게시글 본문 + 댓글 목록 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="post-detail-header">
          <div className="post-detail-author-row">
            <div
              className={"post-card-avatar" + (isAdmin ? " admin" : "")}
              style={{ width: "40px", height: "40px" }}
            >
              <PersonIcon />
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isAdmin ? "#1b4797" : "#333",
                }}
              >
                {post.author}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {timeAgo(post.createdAt)}
              </div>
            </div>
          </div>
          {post.isNotice && (
            <div
              style={{
                display: "inline-block",
                background: "#ff3b30",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                marginBottom: "8px",
              }}
            >
              공지
            </div>
          )}
          <div className="post-detail-title">{post.title}</div>
        </div>

        <div className="post-detail-content">{post.content}</div>

        {post.images && post.images.length > 0 && (
          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {post.images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  display: "block",
                  border: "1px solid #f0f0f0",
                }}
              />
            ))}
          </div>
        )}

        {poll && (
          <div
            style={{
              margin: "0 16px 16px",
              borderRadius: "12px",
              border: "1px solid #e8edf5",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", background: "#f0f4ff" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#1b4797",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                📊 투표
              </div>
              <div
                style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}
              >
                {poll.question}
              </div>
              <div
                style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}
              >
                {poll.totalVotes}명 참여
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {poll.options.map((option) => {
                const isVoted = poll.votedOptionId === option.id;
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
                      border: isVoted
                        ? "2px solid #1b4797"
                        : "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: "#fff",
                      cursor: showResult ? "default" : "pointer",
                      textAlign: "left",
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
                          width: option.percent + "%",
                          background: isVoted ? "#e8edf5" : "#f5f5f5",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: isVoted ? "#1b4797" : "#333",
                          fontWeight: isVoted ? 700 : 400,
                        }}
                      >
                        {isVoted && "✓ "}
                        {option.text}
                      </span>
                      {showResult && (
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: isVoted ? "#1b4797" : "#999",
                          }}
                        >
                          {option.percent}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {!poll.votedOptionId && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#bbb",
                    textAlign: "center",
                    margin: "4px 0 0",
                  }}
                >
                  항목을 선택해 투표하세요
                </p>
              )}
            </div>
          </div>
        )}

        <div className="post-detail-actions">
          <button
            className={"action-btn" + (post.alreadyLiked ? " liked" : "")}
            onClick={handleLikePost}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill={post.alreadyLiked ? "#ff3b30" : "none"}
              stroke={post.alreadyLiked ? "#ff3b30" : "#999"}
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            좋아요 {post.likeCount}
          </button>
          <button className="action-btn">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            댓글 {post.commentCount}
          </button>
        </div>

        <div className="comment-section">
          <div className="comment-count">댓글 {comments.length}</div>
          {parentComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onLike={handleCommentLike}
                onReport={handleCommentReport}
                onReply={(cid) => setReplyTo(cid)}
                onDelete={handleCommentDelete}
                onBlock={handleCommentBlock}
              />
              {childComments
                .filter((c) => c.parentId === comment.id)
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
          {comments.length === 0 && (
            <div className="empty">댓글이 없습니다</div>
          )}
        </div>
      </div>

      {/* 댓글 입력창 — flex 구조로 항상 하단 고정 (position:fixed 아님) */}
      <div
        style={{
          flexShrink: 0,
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        }}
      >
        {replyTo && (
          <div className="reply-indicator">
            <span>답글 작성 중</span>
            <button onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}
        <div className="comment-input-inner">
          <input
            className="comment-input"
            type="text"
            placeholder={replyTo ? "답글 작성..." : "댓글 작성..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommentSubmit();
            }}
          />
          <button className="comment-submit" onClick={handleCommentSubmit}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
