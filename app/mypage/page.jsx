'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard.jsx';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('menu');
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
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

  async function loadMyPosts() {
    setLoading(true);
    const res = await fetch('/api/posts?page=1');
    if (res.ok) {
      const data = await res.json();
      setMyPosts((data.posts || []).filter(p => p.author === user.username || (user.role === 'admin' && p.author === '염광사')));
    }
    setLoading(false);
  }

  async function loadBookmarks() {
    setLoading(true);
    const res = await fetch('/api/bookmarks');
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data.posts || []);
    }
    setLoading(false);
  }

  function handleTab(t) {
    setTab(t);
    if (t === 'posts') loadMyPosts();
    if (t === 'bookmarks') loadBookmarks();
  }

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

      <div style={{ padding: '20px 16px', borderBottom: '8px solid #f0f1f3' }}>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>{user.username}</div>
        <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>{user.role === 'admin' ? '관리자' : '회원'}</div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        {[
          { key: 'menu', label: '메뉴' },
          { key: 'posts', label: '내 글' },
          { key: 'bookmarks', label: '스크랩' }
        ].map(t => (
          <button key={t.key} onClick={() => handleTab(t.key)} style={{
            flex: 1, padding: '12px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #1b4797' : '2px solid transparent',
            color: tab === t.key ? '#1b4797' : '#999',
            fontWeight: tab === t.key ? 700 : 400,
            fontSize: '14px', cursor: 'pointer'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'menu' && (
        <div>
          <div onClick={() => router.push('/profile')} style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '15px' }}>
            프로필 수정 →
          </div>
          {user.role === 'admin' && (
            <div onClick={() => router.push('/admin')} style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '15px' }}>
              관리자 대시보드 →
            </div>
          )}
          <div onClick={handleLogout} style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '15px', color: '#ff3b30' }}>
            로그아웃
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div>
          {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>}
          {!loading && myPosts.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>작성한 글이 없습니다</div>}
          {myPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div>
          {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>}
          {!loading && bookmarks.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>스크랩한 글이 없습니다</div>}
          {bookmarks.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
