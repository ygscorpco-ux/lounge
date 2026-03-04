'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('menu');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) return r.json();
      router.push('/login');
      return null;
    }).then(data => {
      if (data) setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/messages').then(r => r.json()).then(data => {
        setMessages(data.messages || []);
      });
    }
  }, [user]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  if (!user) return <div className='loading'>로딩 중...</div>;

  return (
    <div className='mypage'>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className='back-btn' onClick={() => router.push('/')}>&#x2190;</button>
        <span style={{ color: 'white', fontWeight: 600 }}>마이페이지</span>
      </div>

      <div className='mypage-header'>
        <div className='mypage-username'>{user.username}</div>
        <div className='mypage-role'>{user.role === 'admin' ? '관리자' : '회원'}</div>
      </div>

      <div className='mypage-menu'>
        {user.role === 'admin' && (
          <div className='mypage-menu-item' onClick={() => router.push('/admin')}>
            관리자 대시보드 &#x2192;
          </div>
        )}
        <div className='mypage-menu-item' onClick={() => setTab('messages')}>
          쪽지 ({messages.filter(m => !m.is_read).length}개 안 읽음) &#x2192;
        </div>
        <div className='mypage-menu-item' onClick={handleLogout}>
          로그아웃 &#x2192;
        </div>
      </div>

      {tab === 'messages' && (
        <div className='message-list'>
          {messages.length === 0 && <div className='empty'>쪽지가 없습니다</div>}
          {messages.map(msg => (
            <div key={msg.id} className={'message-item' + (!msg.is_read ? ' message-unread' : '')}>
              <div className='message-content'>{msg.content}</div>
              <div className='message-time'>{new Date(msg.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
