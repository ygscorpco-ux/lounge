'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unreadCount || 0);
        }
      } catch (e) {}
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className='header'>
      <div className='header-logo' onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        라운지
      </div>
      <div className='header-icons'>
        <button className='header-icon' onClick={() => router.push('/search')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button className='header-icon' onClick={() => router.push('/notifications')} style={{ position: 'relative' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {unread > 0 && (
            <span className='noti-badge'>{unread > 9 ? '9+' : unread}</span>
          )}
        </button>
        <button className='header-icon' onClick={() => router.push('/mypage')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
      </div>
    </header>
  );
}
