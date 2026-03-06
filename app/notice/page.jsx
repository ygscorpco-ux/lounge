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
  const [orderDrafts, setOrderDrafts] = useState({});
  const router = useRouter();

  function makeOrderDrafts(items) {
    const next = {};
    for (const item of items) {
      next[item.id] = String(item.noticeOrder ?? 1000);
    }
    return next;
  }

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
      const list = data.posts || [];
      setPosts(list);
      setOrderDrafts(makeOrderDrafts(list));
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

  async function updateNotice(postId, payload) {
    setSavingPostId(postId);
    try {
      const response = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "\uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }

      await loadNotices(true);
    } catch (error) {
      console.error(error);
      alert("\uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setSavingPostId(null);
  }

  async function applyOrder(postId) {
    const raw = orderDrafts[postId];
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) {
      alert("\uC21C\uC11C\uB294 0~9999 \uC815\uC218\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    await updateNotice(postId, { noticeOrder: parsed });
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

      {loading && (
        <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>
      )}

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
          {"\uACF5\uC9C0 \uAD00\uB9AC: \uACE0\uC815 1\u00B72\uBC88\uC740 \uD648 \uCD5C\uC0C1\uB2E8 \uB178\uCD9C, \uB178\uCD9C OFF \uC2DC \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC228\uAE40, \uC21C\uC11C \uC22B\uC790\uAC00 \uC791\uC744\uC218\uB85D \uBA3C\uC800 \uBCF4\uC785\uB2C8\uB2E4."}
        </div>
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
            {post.noticePinSlot && (
              <span
                style={{
                  marginLeft: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#ebf2ff",
                  borderRadius: 999,
                  width: 18,
                  height: 18,
                  justifyContent: "center",
                }}
                aria-label="고정 공지"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="#1b4797"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 17v5" />
                  <path d="M5 4h14l-3 6v3H8v-3L5 4z" />
                </svg>
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
                  gridTemplateColumns: "1fr 1fr 1fr",
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
                    disabled={savingPostId === post.id}
                    onChange={(event) =>
                      updateNotice(post.id, {
                        noticeVisible: event.target.checked,
                      })
                    }
                    style={{ accentColor: "#1b4797" }}
                  />
                  {"\uB178\uCD9C"}
                </label>

                <select
                  value={post.noticePinSlot ?? 0}
                  disabled={savingPostId === post.id}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    updateNotice(post.id, {
                      noticePinSlot: value === 0 ? null : value,
                    });
                  }}
                  style={{
                    border: "1px solid #dfe5ee",
                    borderRadius: 8,
                    padding: "6px 8px",
                    fontSize: 12,
                    color: "#1f2430",
                    background: "#fff",
                  }}
                >
                  <option value={0}>{"\uACE0\uC815 \uC5C6\uC74C"}</option>
                  <option value={1}>{"\uACE0\uC815 1"}</option>
                  <option value={2}>{"\uACE0\uC815 2"}</option>
                </select>

                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={orderDrafts[post.id] ?? ""}
                    disabled={savingPostId === post.id}
                    onChange={(event) =>
                      setOrderDrafts((prev) => ({
                        ...prev,
                        [post.id]: event.target.value,
                      }))
                    }
                    onBlur={() => applyOrder(post.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    style={{
                      width: "100%",
                      border: "1px solid #dfe5ee",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 12,
                      color: "#1f2430",
                      background: "#fff",
                    }}
                  />
                </div>
              </div>
            )}
          </article>
        ))}
    </div>
  );
}
