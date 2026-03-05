'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard.jsx';

export default function NoticePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { async function load() { const r = await fetch('/api/posts?category=염광사'); if (r.ok) { const d = await r.json(); setPosts(d.posts || []); } setLoading(false); } load(); }, []);

  return (
    <div>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>공지사항</span>
      </div>
      {loading && <div className='loading'>로딩 중...</div>}
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      {!loading && posts.length === 0 && <div className='empty'>공지사항이 없습니다</div>}
    </div>
  );
}
