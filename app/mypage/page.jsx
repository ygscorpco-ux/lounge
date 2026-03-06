"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PostCard from "../../components/PostCard.jsx";

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("menu");
  const [myPosts, setMyPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) return r.json();
        router.push("/login");
        return null;
      })
      .then((d) => {
        if (d) setUser(d.user);
      });
  }, []);

  async function loadMyPosts() {
    setLoading(true);
    const r = await fetch("/api/posts?page=1");
    if (r.ok) {
      const d = await r.json();
      setMyPosts(
        (d.posts || []).filter(
          (p) =>
            p.author === user.username ||
            (user.role === "admin" && p.author === "염광사"),
        ),
      );
    }
    setLoading(false);
  }

  async function loadBookmarks() {
    setLoading(true);
    const r = await fetch("/api/bookmarks");
    if (r.ok) {
      const d = await r.json();
      setBookmarks(d.posts || []);
    }
    setLoading(false);
  }

  async function loadBlockedUsers() {
    setLoading(true);
    const r = await fetch("/api/blocks");
    if (r.ok) {
      const d = await r.json();
      setBlockedUsers(d.blockedUsers || []);
    }
    setLoading(false);
  }

  // 차단 해제: POST /api/blocks는 토글 방식 (이미 차단되어 있으면 해제됨)
  async function handleUnblock(userId) {
    const r = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (r.ok) {
      // 해제된 유저를 목록에서 즉시 제거
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }

  function handleTab(t) {
    setTab(t);
    if (t === "posts") loadMyPosts();
    if (t === "bookmarks") loadBookmarks();
    if (t === "blocks") loadBlockedUsers();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) return <div className="loading">로딩 중...</div>;

  const TABS = [
    { key: "menu", label: "메뉴" },
    { key: "posts", label: "내 글" },
    { key: "bookmarks", label: "스크랩" },
    { key: "blocks", label: "차단" },
  ];

  return (
    <div>
      <div className="top-bar">
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
        <span className="top-bar-title">마이페이지</span>
      </div>

      <div className="mypage-profile">
        <div className="mypage-username">{user.username}</div>
        <div className="mypage-role">
          {user.role === "admin" ? "관리자" : "회원"}
        </div>
      </div>

      <div className="mypage-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"mypage-tab" + (tab === t.key ? " active" : "")}
            onClick={() => handleTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 메뉴 탭 */}
      {tab === "menu" && (
        <div>
          <div
            className="mypage-menu-item"
            onClick={() => router.push("/profile")}
          >
            프로필 수정 <span className="mypage-menu-arrow">›</span>
          </div>
          {/* 이용규칙 페이지로 이동 */}
          <div
            className="mypage-menu-item"
            onClick={() => router.push("/rules")}
          >
            이용규칙 보기 <span className="mypage-menu-arrow">›</span>
          </div>
          {user.role === "admin" && (
            <>
              <div
                className="mypage-menu-item"
                onClick={() => router.push("/admin")}
              >
                관리자 대시보드 <span className="mypage-menu-arrow">›</span>
              </div>
              <div
                className="mypage-menu-item"
                onClick={() => router.push("/admin/monitoring")}
              >
                모니터링 대시보드 <span className="mypage-menu-arrow">›</span>
              </div>
            </>
          )}
          <div className="mypage-menu-item danger" onClick={handleLogout}>
            로그아웃
          </div>
        </div>
      )}

      {/* 내 글 탭 */}
      {tab === "posts" && (
        <div>
          {loading && <div className="loading">로딩 중...</div>}
          {!loading && myPosts.length === 0 && (
            <div className="empty">작성한 글이 없습니다</div>
          )}
          {myPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* 스크랩 탭 */}
      {tab === "bookmarks" && (
        <div>
          {loading && <div className="loading">로딩 중...</div>}
          {!loading && bookmarks.length === 0 && (
            <div className="empty">스크랩한 글이 없습니다</div>
          )}
          {bookmarks.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* 차단 목록 탭 */}
      {tab === "blocks" && (
        <div>
          {loading && <div className="loading">로딩 중...</div>}
          {!loading && blockedUsers.length === 0 && (
            <div className="empty">차단한 사용자가 없습니다</div>
          )}
          {blockedUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ fontSize: "15px", color: "#1a1a1a" }}>
                {u.username}
              </span>
              <button
                onClick={() => handleUnblock(u.id)}
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  borderRadius: "20px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                차단 해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
