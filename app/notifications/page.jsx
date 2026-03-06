"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return "어제";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getText(notification) {
  if (notification.type === "comment") return "게시글에 댓글이 달렸습니다.";
  if (notification.type === "reply") return "내 댓글에 답글이 달렸습니다.";
  if (notification.type === "like") return "게시글에 좋아요가 눌렸습니다.";
  return "새 알림";
}

function NotificationsSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: index === 0 ? "#f7faff" : "#fff",
          }}
        >
          <div className="app-skeleton" style={{ width: `${82 - index * 6}%`, height: 16, borderRadius: 8, marginBottom: 8 }} />
          <div className="app-skeleton" style={{ width: "34%", height: 12, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          if (active) {
            setNotifications(data.notifications || []);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      fetch("/api/notifications", { method: "PUT" }).catch(() => null);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="top-bar-title">알림</span>
      </div>
      {loading && <NotificationsSkeleton />}
      {!loading && notifications.length === 0 && <div className="empty">알림이 없습니다.</div>}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => (
            notification.target_type === "post"
              ? router.push("/post/" + notification.target_id)
              : router.push("/")
          )}
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: notification.is_read ? "#fff" : "#f0f4ff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "14px", color: "#333" }}>{getText(notification)}</div>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
            {timeAgo(notification.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
