"use client";
import { useRouter } from "next/navigation";

const ADMIN_NAME = "\uC5FC\uAD11\uC0AC";
const ANON_NAME = "\uC775\uBA85";

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "\uBC29\uAE08";
  if (diff < 3600) return `${Math.floor(diff / 60)}\uBD84 \uC804`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}\uC2DC\uAC04 \uC804`;
  if (diff < 172800) return "\uC5B4\uC81C";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const CommentIcon = ({ color = "#42bcc4" }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function PostCard({ post }) {
  const router = useRouter();
  const displayAuthor = post.author === ADMIN_NAME ? ADMIN_NAME : ANON_NAME;
  const hasComments = (post.commentCount || 0) > 0;

  return (
    <article
      onClick={() => router.push("/post/" + post.id)}
      style={{
        borderBottom: "1px solid #ececec",
        background: "#fff",
        padding: "16px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {post.isNotice && (
            <span
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 700,
                color: "#fff",
                background: "#ff5f5f",
                borderRadius: "10px",
                padding: "2px 7px",
                marginBottom: "7px",
              }}
            >
              {"\uACF5\uC9C0"}
            </span>
          )}

          <div
            style={{
              fontSize: "22px",
              lineHeight: 1.28,
              fontWeight: 800,
              color: "#2b2f36",
              marginBottom: "6px",
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {post.title}
          </div>

          <div
            style={{
              fontSize: "18px",
              lineHeight: 1.35,
              color: "#3f434b",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: "10px",
              wordBreak: "break-word",
            }}
          >
            {post.content}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#b0b0b0",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            {hasComments && (
              <>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "#42bcc4",
                    fontWeight: 600,
                  }}
                >
                  <CommentIcon />
                  {post.commentCount}
                </span>
                <span style={{ color: "#d2d2d2" }}>|</span>
              </>
            )}
            <span>{timeAgo(post.createdAt)}</span>
            <span style={{ color: "#d2d2d2" }}>|</span>
            <span>{displayAuthor}</span>
          </div>
        </div>

        {post.thumbnailUrl && (
          <img
            src={post.thumbnailUrl}
            alt=""
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "10px",
              objectFit: "cover",
              border: "1px solid #ebeef2",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
        )}
      </div>
    </article>
  );
}
