'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 172800) return '어제';
  return (date.getMonth() + 1) + '/' + date.getDate();
}

function getNotificationText(n) {
  if (n.type === 'comment') return '내 글에 댓글이 달렸습니다';
  if (n.type === 'reply') return '내 댓글에 답글이 달렸습니다';
  if (n.type === 'like') return '내 글에 좋아요가 눌렸습니다';
  return '새 알림';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
      setLoading(false);
      await fetch('/api/notifications', { method: 'PUT' });
    }
    load();
  }, []);

  function handleClick(n) {
    if (n.target_type === 'post') router.push('/post/' + n.target_id);
    else router.push('/');
  }

  return (
    <div>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>알림</span>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>}
      {!loading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>알림이 없습니다</div>
      )}
      {notifications.map(n => (
        <div key={n.id} onClick={() => handleClick(n)} style={{
          padding: '14px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: n.is_read ? 'white' : '#f0f4ff',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: '14px', color: '#333' }}>{getNotificationText(n)}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
        </div>
      ))}
    </div>
  );
}
