'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard.jsx';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('menu');
  const [myPosts, setMyPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { fetch('/api/auth/me').then(r => { if (r.ok) return r.json(); router.push('/login'); return null; }).then(d => { if (d) setUser(d.user); }); }, []);

  async function loadMyPosts() { setLoading(true); const r = await fetch('/api/posts?page=1'); if (r.ok) { const d = await r.json(); setMyPosts((d.posts || []).filter(p => p.author === user.username || (user.role === 'admin' && p.author === '염광사'))); } setLoading(false); }
  async function loadBookmarks() { setLoading(true); const r = await fetch('/api/bookmarks'); if (r.ok) { const d = await r.json(); setBookmarks(d.posts || []); } setLoading(false); }

  function handleTab(t) { setTab(t); if (t === 'posts') loadMyPosts(); if (t === 'bookmarks') loadBookmarks(); }
  async function handleLogout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }

  if (!user) return <div className='loading'>로딩 중...</div>;

  return (
    <div>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.push('/')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>마이페이지</span>
      </div>

      <div className='mypage-profile'>
        <div className='mypage-username'>{user.username}</div>
        <div className='mypage-role'>{user.role === 'admin' ? '관리자' : '회원'}</div>
      </div>

      <div className='mypage-tabs'>
        {[{ key: 'menu', label: '메뉴' }, { key: 'posts', label: '내 글' }, { key: 'bookmarks', label: '스크랩' }].map(t => (
          <button key={t.key} className={'mypage-tab' + (tab === t.key ? ' active' : '')} onClick={() => handleTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'menu' && (
        <div>
          <div className='mypage-menu-item' onClick={() => router.push('/profile')}>프로필 수정 <span className='mypage-menu-arrow'>›</span></div>
          {user.role === 'admin' && <div className='mypage-menu-item' onClick={() => router.push('/admin')}>관리자 대시보드 <span className='mypage-menu-arrow'>›</span></div>}
          <div className='mypage-menu-item danger' onClick={handleLogout}>로그아웃</div>
        </div>
      )}
      {tab === 'posts' && (<div>{loading && <div className='loading'>로딩 중...</div>}{!loading && myPosts.length === 0 && <div className='empty'>작성한 글이 없습니다</div>}{myPosts.map(p => <PostCard key={p.id} post={p} />)}</div>)}
      {tab === 'bookmarks' && (<div>{loading && <div className='loading'>로딩 중...</div>}{!loading && bookmarks.length === 0 && <div className='empty'>스크랩한 글이 없습니다</div>}{bookmarks.map(p => <PostCard key={p.id} post={p} />)}</div>)}
    </div>
  );
}
