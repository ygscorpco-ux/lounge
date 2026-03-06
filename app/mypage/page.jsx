"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "../../components/PostCard.jsx";

function MyPageSkeleton() {
  return (
    <div>
      <div className="top-bar">
        <div className="app-skeleton" style={{ width: 36, height: 36, borderRadius: 12 }} />
        <div className="app-skeleton" style={{ width: 96, height: 20, borderRadius: 10 }} />
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: "18px 16px 12px" }}>
        <div className="app-skeleton" style={{ width: 128, height: 22, borderRadius: 10, marginBottom: 8 }} />
        <div className="app-skeleton" style={{ width: 74, height: 16, borderRadius: 999 }} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="app-skeleton"
            style={{ flex: 1, height: 38, borderRadius: 14 }}
          />
        ))}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div className="app-skeleton" style={{ width: `${82 + index * 6}px`, height: 16, borderRadius: 8 }} />
            <div className="app-skeleton" style={{ width: 18, height: 18, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PostListSkeleton({ rows = 3 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            borderBottom: "1px solid #ececec",
            background: "#fff",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="app-skeleton" style={{ width: `${72 - index * 6}%`, height: 17, borderRadius: 8, marginBottom: 10 }} />
              <div className="app-skeleton" style={{ width: "100%", height: 13, borderRadius: 8, marginBottom: 7 }} />
              <div className="app-skeleton" style={{ width: "84%", height: 13, borderRadius: 8, marginBottom: 9 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div className="app-skeleton" style={{ width: 40, height: 12, borderRadius: 999 }} />
                <div className="app-skeleton" style={{ width: 46, height: 12, borderRadius: 999 }} />
              </div>
            </div>
            <div className="app-skeleton" style={{ width: 84, height: 84, borderRadius: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockListSkeleton({ rows = 4 }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div className="app-skeleton" style={{ width: `${88 - index * 10}px`, height: 16, borderRadius: 8 }} />
          <div className="app-skeleton" style={{ width: 72, height: 30, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("menu");
  const [myPosts, setMyPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => {
        if (response.ok) return response.json();
        router.push("/login");
        return null;
      })
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user);
        }
      })
      .finally(() => {
        if (active) {
          setBootLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function loadMyPosts() {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/posts?page=1");
      if (!response.ok) return;
      const data = await response.json();
      setMyPosts(
        (data.posts || []).filter(
          (post) =>
            post.author === user.username
            || (user.role === "admin" && post.author === "\uC5FC\uAD11\uC0AC"),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBookmarks() {
    setLoading(true);
    try {
      const response = await fetch("/api/bookmarks");
      if (!response.ok) return;
      const data = await response.json();
      setBookmarks(data.posts || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadBlockedUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/blocks");
      if (!response.ok) return;
      const data = await response.json();
      setBlockedUsers(data.blockedUsers || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock(userId) {
    const previousBlockedUsers = blockedUsers;
    setBlockedUsers((prev) => prev.filter((blockedUser) => blockedUser.id !== userId));

    const response = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      setBlockedUsers(previousBlockedUsers);
      alert("차단 해제에 실패했습니다.");
    }
  }

  function handleTab(nextTab) {
    setTab(nextTab);
    if (nextTab === "posts") loadMyPosts();
    if (nextTab === "bookmarks") loadBookmarks();
    if (nextTab === "blocks") loadBlockedUsers();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (bootLoading) return <MyPageSkeleton />;
  if (!user) return null;

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "posts", label: "내 글" },
    { key: "bookmarks", label: "스크랩" },
    { key: "blocks", label: "차단" },
  ];

  return (
    <div>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.push("/")}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="top-bar-title">마이페이지</span>
      </div>

      <div className="mypage-profile">
        <div className="mypage-username">{user.username}</div>
        <div className="mypage-role">{user.role === "admin" ? "관리자" : "회원"}</div>
      </div>

      <div className="mypage-tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={"mypage-tab" + (tab === item.key ? " active" : "")}
            onClick={() => handleTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "menu" && (
        <div>
          <div className="mypage-menu-item" onClick={() => router.push("/profile")}>
            프로필 수정 <span className="mypage-menu-arrow">›</span>
          </div>
          <div className="mypage-menu-item" onClick={() => router.push("/rules")}>
            이용규칙 보기 <span className="mypage-menu-arrow">›</span>
          </div>
          {user.role === "admin" && (
            <>
              <div className="mypage-menu-item" onClick={() => router.push("/admin")}>
                관리자 대시보드 <span className="mypage-menu-arrow">›</span>
              </div>
              <div className="mypage-menu-item" onClick={() => router.push("/admin/monitoring")}>
                모니터링 대시보드 <span className="mypage-menu-arrow">›</span>
              </div>
            </>
          )}
          <div className="mypage-menu-item danger" onClick={handleLogout}>
            로그아웃
          </div>
        </div>
      )}

      {tab === "posts" && (
        <div>
          {loading && <PostListSkeleton />}
          {!loading && myPosts.length === 0 && <div className="empty">작성한 글이 없습니다.</div>}
          {myPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {tab === "bookmarks" && (
        <div>
          {loading && <PostListSkeleton />}
          {!loading && bookmarks.length === 0 && <div className="empty">스크랩한 글이 없습니다.</div>}
          {bookmarks.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {tab === "blocks" && (
        <div>
          {loading && <BlockListSkeleton />}
          {!loading && blockedUsers.length === 0 && <div className="empty">차단한 사용자가 없습니다.</div>}
          {blockedUsers.map((blockedUser) => (
            <div
              key={blockedUser.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ fontSize: "15px", color: "#1a1a1a" }}>{blockedUser.username}</span>
              <button
                onClick={() => handleUnblock(blockedUser.id)}
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
