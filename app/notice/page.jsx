"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

function toDateInputValue(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function parseDateInputToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function resolveNoticeState(post) {
  if (!post.noticeVisible) return "hidden";

  const now = Date.now();
  const start = post.noticeStartAt ? new Date(post.noticeStartAt).getTime() : null;
  const end = post.noticeEndAt ? new Date(post.noticeEndAt).getTime() : null;

  if (Number.isFinite(start) && start > now) return "scheduled";
  if (Number.isFinite(end) && end < now) return "ended";
  return "active";
}

export default function NoticePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingPostId, setSavingPostId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const router = useRouter();

  function hydrateScheduleDrafts(list) {
    const nextDrafts = {};
    for (const post of list) {
      nextDrafts[post.id] = {
        noticeStartAt: toDateInputValue(post.noticeStartAt),
        noticeEndAt: toDateInputValue(post.noticeEndAt),
      };
    }
    setScheduleDrafts(nextDrafts);
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
        hydrateScheduleDrafts([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const nextPosts = data.posts || [];
      setPosts(nextPosts);
      hydrateScheduleDrafts(nextPosts);
    } catch (error) {
      console.error(error);
      setPosts([]);
      hydrateScheduleDrafts([]);
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
        alert(data.error || "\uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, noticeVisible: visible } : post,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("\uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
    setSavingPostId(null);
  }

  async function saveNoticeSchedule(postId) {
    const draft = scheduleDrafts[postId] || { noticeStartAt: "", noticeEndAt: "" };
    const startAt = parseDateInputToIso(draft.noticeStartAt);
    const endAt = parseDateInputToIso(draft.noticeEndAt);

    if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) {
      alert("\uACF5\uC9C0 \uC2DC\uC791\uC2DC\uAC01\uC740 \uC885\uB8CC\uC2DC\uAC01\uBCF4\uB2E4 \uC774\uC804\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
      return;
    }

    setSavingPostId(postId);
    try {
      const response = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          noticeStartAt: startAt,
          noticeEndAt: endAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "\uC77C\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                noticeStartAt: startAt,
                noticeEndAt: endAt,
              }
            : post,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("\uC77C\uC815 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
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
        alert(data.error || "\uC21C\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        await loadNotices(true);
      } else {
        setPosts(nextPosts);
      }
    } catch (error) {
      console.error(error);
      alert("\uC21C\uC11C \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
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
          {
            "\uACF5\uC9C0 \uAD00\uB9AC: \uB178\uCD9C ON/OFF, \uC2DC\uC791\u00B7\uC885\uB8CC \uC2DC\uAC01 \uC124\uC815, \uC21C\uC11C \uC870\uC815\uC73C\uB85C \uD648 \uB178\uCD9C\uB97C \uC6B4\uC601\uD569\uB2C8\uB2E4."
          }
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty">{"\uB4F1\uB85D\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
      )}

      {!loading &&
        posts.map((post, index) => {
          const state = resolveNoticeState(post);

          return (
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

              {isAdmin && (
                <span
                  style={{
                    marginLeft: 6,
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      state === "active"
                        ? "#206d3a"
                        : state === "scheduled"
                          ? "#516fb6"
                          : "#8e97a3",
                    background:
                      state === "active"
                        ? "#e8f7ee"
                        : state === "scheduled"
                          ? "#eef2ff"
                          : "#eef1f5",
                    borderRadius: 999,
                    padding: "2px 7px",
                  }}
                >
                  {state === "active"
                    ? "\uB178\uCD9C\uC911"
                    : state === "scheduled"
                      ? "\uC608\uC57D"
                      : state === "ended"
                        ? "\uC885\uB8CC"
                        : "\uC228\uAE40"}
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
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: 6,
                      alignItems: "center",
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: 6,
                      alignItems: "end",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "#7f8897", fontWeight: 600 }}>
                        {"\uC2DC\uC791"}
                      </span>
                      <input
                        type="datetime-local"
                        value={scheduleDrafts[post.id]?.noticeStartAt || ""}
                        onChange={(event) =>
                          setScheduleDrafts((prev) => ({
                            ...prev,
                            [post.id]: {
                              ...(prev[post.id] || {}),
                              noticeStartAt: event.target.value,
                            },
                          }))
                        }
                        style={{
                          width: "100%",
                          border: "1px solid #dbe3ef",
                          borderRadius: 8,
                          padding: "7px 8px",
                          fontSize: 12,
                          color: "#3e4a5b",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "#7f8897", fontWeight: 600 }}>
                        {"\uC885\uB8CC"}
                      </span>
                      <input
                        type="datetime-local"
                        value={scheduleDrafts[post.id]?.noticeEndAt || ""}
                        onChange={(event) =>
                          setScheduleDrafts((prev) => ({
                            ...prev,
                            [post.id]: {
                              ...(prev[post.id] || {}),
                              noticeEndAt: event.target.value,
                            },
                          }))
                        }
                        style={{
                          width: "100%",
                          border: "1px solid #dbe3ef",
                          borderRadius: 8,
                          padding: "7px 8px",
                          fontSize: 12,
                          color: "#3e4a5b",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => saveNoticeSchedule(post.id)}
                      disabled={savingPostId === post.id || reordering}
                      style={{
                        border: "1px solid #dfe5ee",
                        background: "#fff",
                        borderRadius: 8,
                        padding: "7px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          savingPostId === post.id || reordering
                            ? "#a4adbb"
                            : "#1b4797",
                        cursor:
                          savingPostId === post.id || reordering
                            ? "default"
                            : "pointer",
                      }}
                    >
                      {"\uC800\uC7A5"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
    </div>
  );
}
