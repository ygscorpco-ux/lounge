"use client";
import { useState } from "react";

const ADMIN_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_NAME = "\uC775\uBA85";

function formatCommentTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "\uBC29\uAE08 \uC804";
  if (diff < 3600) return `${Math.floor(diff / 60)}\uBD84 \uC804`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}\uC2DC\uAC04 \uC804`;
  if (diff < 172800) return "\uC5B4\uC81C";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

const PersonIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#a0aec0">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const BubbleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9aa3b2" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ThumbIcon = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill={active ? "#1b4797" : "none"}
    stroke={active ? "#1b4797" : "#9aa3b2"}
    strokeWidth="2"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-1 7H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h9l5-8-5-3z" />
  </svg>
);

export default function CommentItem({
  comment,
  onLike,
  onReport,
  onReply,
  onDelete,
  onBlock,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = comment.author === ADMIN_NAME;
  const author = isAdmin ? ADMIN_NAME : ANON_NAME;

  return (
    <div
      style={{
        padding: comment.parentId ? "14px 16px 14px 44px" : "14px 16px",
        background: comment.parentId ? "#fbfcff" : "#fff",
        borderBottom: "1px solid #f2f3f5",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div
          className={"comment-avatar" + (isAdmin ? " admin" : "")}
          style={{ width: 32, height: 32 }}
        >
          <PersonIcon />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: isAdmin ? "#1b4797" : "#222",
                  marginBottom: 4,
                }}
              >
                {author}
              </div>
              <div style={{ fontSize: 16, color: "#2f3238", lineHeight: 1.45, marginBottom: 8 }}>
                {comment.content}
              </div>
              <div style={{ fontSize: 12, color: "#9aa0aa" }}>{formatCommentTime(comment.createdAt)}</div>
            </div>

            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 36,
                  padding: "0 10px",
                  borderRadius: 8,
                  background: "#f4f5f7",
                  border: "1px solid #eceef2",
                }}
              >
                {!comment.parentId && (
                  <button
                    onClick={() => onReply(comment.id)}
                    style={{ border: "none", background: "none", display: "flex", padding: 0 }}
                    title="\uB2F5\uAE00"
                  >
                    <BubbleIcon />
                  </button>
                )}
                <button
                  onClick={() => onLike(comment.id)}
                  style={{ border: "none", background: "none", display: "flex", padding: 0 }}
                  title="\uC88B\uC544\uC694"
                >
                  <ThumbIcon active={comment.alreadyLiked} />
                </button>
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: 16,
                    lineHeight: 1,
                    color: "#9aa3b2",
                    padding: 0,
                  }}
                  title="\uBA54\uB274"
                >
                  {"\u22EE"}
                </button>
              </div>

              {showMenu && (
                <div className="dropdown-menu" style={{ right: 0, top: 40 }}>
                  {(comment.isAuthor || comment.isAdmin) && (
                    <div
                      className="dropdown-item danger"
                      onClick={() => {
                        onDelete(comment.id);
                        setShowMenu(false);
                      }}
                    >
                      {"\uC0AD\uC81C"}
                    </div>
                  )}
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      onReport(comment.id);
                      setShowMenu(false);
                    }}
                  >
                    {"\uC2E0\uACE0"}
                  </div>
                  {!comment.isAuthor && comment.userId && (
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        onBlock(comment.userId);
                        setShowMenu(false);
                      }}
                    >
                      {"\uCC28\uB2E8"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: comment.alreadyLiked ? "#1b4797" : "#a4acb8", fontWeight: 600 }}>
            {`\uC88B\uC544\uC694 ${comment.likeCount || 0}`}
          </div>
        </div>
      </div>
    </div>
  );
}
