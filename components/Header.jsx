'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header({ user }) {
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
          &#x1F50D;
        </button>
        <button className='header-icon' onClick={() => router.push('/notifications')} style={{ position: 'relative' }}>
          &#x1F514;
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#ff3b30',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button className='header-icon' onClick={() => router.push('/mypage')}>
          &#x1F464;
        </button>
      </div>
    </header>
  );
}
