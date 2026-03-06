"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

export default function NoticePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          "/api/posts?noticeOnly=1&sort=latest&page=1&t=" + Date.now(),
        );
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
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
        <span className="top-bar-title">{"\uACF5\uC9C0\uC0AC\uD56D"}</span>
      </div>

      {loading && (
        <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty">
          {"\uB4F1\uB85D\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </div>
      )}

      {!loading &&
        posts.map((post) => (
          <article
            key={post.id}
            onClick={() => router.push("/post/" + post.id)}
            style={{
              borderBottom: "1px solid #eceff4",
              padding: "14px 16px",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 700,
                color: "#fff",
                background: "#ff5f5f",
                borderRadius: "999px",
                padding: "2px 7px",
                marginBottom: "8px",
              }}
            >
              {"\uACF5\uC9C0"}
            </div>

            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1f2430",
                lineHeight: 1.35,
                marginBottom: "5px",
              }}
            >
              {post.title}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#4c5564",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginBottom: "7px",
              }}
            >
              {post.content}
            </div>

            <div style={{ fontSize: "12px", color: "#9aa3af", fontWeight: 500 }}>
              {formatDateTime(post.createdAt)}
            </div>
          </article>
        ))}
    </div>
  );
}
