'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function timeAgo(dateString) {
  const now = new Date(); const date = new Date(dateString); const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '방금 전'; if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전'; if (diff < 172800) return '어제';
  return (date.getMonth() + 1) + '/' + date.getDate();
}

function getText(n) {
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
      const res = await fetch('/api/notifications'); if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); }
      setLoading(false); await fetch('/api/notifications', { method: 'PUT' });
    }
    load();
  }, []);

  return (
    <div>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>알림</span>
      </div>
      {loading && <div className='loading'>로딩 중...</div>}
      {!loading && notifications.length === 0 && <div className='empty'>알림이 없습니다</div>}
      {notifications.map(n => (
        <div key={n.id} onClick={() => n.target_type === 'post' ? router.push('/post/' + n.target_id) : router.push('/')} style={{
          padding: '14px 16px', borderBottom: '1px solid #f0f0f0', background: n.is_read ? '#fff' : '#f0f4ff', cursor: 'pointer'
        }}>
          <div style={{ fontSize: '14px', color: '#333' }}>{getText(n)}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
        </div>
      ))}
    </div>
  );
}
