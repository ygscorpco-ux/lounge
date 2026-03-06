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
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingPostId, setSavingPostId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const router = useRouter();

  async function loadNotices(adminMode) {
    setLoading(true);
    try {
      const endpoint = adminMode
        ? "/api/admin/notices?t=" + Date.now()
        : "/api/posts?noticeOnly=1&sort=latest&page=1&t=" + Date.now();

      const response = await fetch(endpoint);
      if (!response.ok) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error(error);
      setPosts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const meResponse = await fetch("/api/auth/me");
        if (meResponse.ok) {
          const meData = await meResponse.json();
          const admin = meData?.user?.role === "admin";
          setIsAdmin(admin);
          await loadNotices(admin);
          return;
        }
      } catch (error) {
        console.error(error);
      }
      await loadNotices(false);
    }

    bootstrap();
  }, []);

  async function updateNoticeVisibility(postId, visible) {
    setSavingPostId(postId);
    try {
      const response = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, noticeVisible: visible }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "업데이트에 실패했습니다.");
        return;
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, noticeVisible: visible } : post,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("업데이트 중 오류가 발생했습니다.");
    }
    setSavingPostId(null);
  }

  async function persistOrder(nextPosts) {
    setReordering(true);
    try {
      const orderedIds = nextPosts.map((post) => post.id);
      const response = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "순서 저장에 실패했습니다.");
        await loadNotices(true);
      } else {
        setPosts(nextPosts);
      }
    } catch (error) {
      console.error(error);
      alert("순서 저장 중 오류가 발생했습니다.");
      await loadNotices(true);
    }
    setReordering(false);
  }

  function movePost(index, direction) {
    if (reordering) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= posts.length) return;

    const nextPosts = [...posts];
    const tmp = nextPosts[index];
    nextPosts[index] = nextPosts[targetIndex];
    nextPosts[targetIndex] = tmp;
    setPosts(nextPosts);
    persistOrder(nextPosts);
  }

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

      {loading && <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>}

      {!loading && isAdmin && (
        <div
          style={{
            margin: "10px 16px 8px",
            border: "1px solid #e7ebf2",
            borderRadius: 12,
            background: "#f8fbff",
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.55,
            color: "#4f5c70",
          }}
        >
          {"\uACF5\uC9C0 \uAD00\uB9AC: \uB178\uCD9C OFF \uC2DC \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC228\uAE40, \uC704/\uC544\uB798 \uBC84\uD2BC\uC73C\uB85C \uC21C\uC11C \uC815\uB82C (\uD648\uC5D0\uC11C\uB294 \uC815\uB82C \uB41C \uC21C\uC11C \uC0C1\uC704 4\uAC1C\uB9CC \uB178\uCD9C)."}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty">{"\uB4F1\uB85D\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
      )}

      {!loading &&
        posts.map((post, index) => (
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
            {isAdmin && !post.noticeVisible && (
              <span
                style={{
                  marginLeft: 6,
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#8e97a3",
                  background: "#eef1f5",
                  borderRadius: 999,
                  padding: "2px 7px",
                }}
              >
                {"\uC228\uAE40"}
              </span>
            )}

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

            {isAdmin && (
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  marginTop: 10,
                  borderTop: "1px solid #eef1f5",
                  paddingTop: 10,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#556070",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!post.noticeVisible}
                    disabled={savingPostId === post.id || reordering}
                    onChange={(event) =>
                      updateNoticeVisibility(post.id, event.target.checked)
                    }
                    style={{ accentColor: "#1b4797" }}
                  />
                  {"\uB178\uCD9C"}
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button
                    type="button"
                    disabled={index === 0 || reordering}
                    onClick={() => movePost(index, -1)}
                    style={{
                      border: "1px solid #dfe5ee",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 12,
                      color: index === 0 || reordering ? "#b8c0cc" : "#516072",
                      cursor: index === 0 || reordering ? "default" : "pointer",
                    }}
                  >
                    {"\uC704"}
                  </button>
                  <button
                    type="button"
                    disabled={index === posts.length - 1 || reordering}
                    onClick={() => movePost(index, 1)}
                    style={{
                      border: "1px solid #dfe5ee",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 12,
                      color:
                        index === posts.length - 1 || reordering
                          ? "#b8c0cc"
                          : "#516072",
                      cursor:
                        index === posts.length - 1 || reordering
                          ? "default"
                          : "pointer",
                    }}
                  >
                    {"\uC544\uB798"}
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
    </div>
  );
}
