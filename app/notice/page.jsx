'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard.jsx';

export default function NoticePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/posts?category=염광사');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>공지사항</span>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>}
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>공지사항이 없습니다</div>
      )}
    </div>
  );
}
