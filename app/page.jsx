'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import PostCard from '../components/PostCard.jsx';
import WriteButton from '../components/WriteButton.jsx';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [bestPosts, setBestPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchPosts = useCallback(async (p, cat, s, reset) => {
    setLoading(true);
    try {
      let url = '/api/posts?page=' + p + '&sort=' + s;
      if (cat) url += '&category=' + encodeURIComponent(cat);
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      }
      setHasMore((data.posts || []).length >= data.pageSize);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const fetchBest = useCallback(async () => {
    try {
      const res = await fetch('/api/posts/best', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBestPosts(data.posts || []);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchBest();
  }, [fetchBest]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, category, sort, true);
  }, [category, sort, fetchPosts]);

  useEffect(() => {
    function handleFocus() {
      setPage(1);
      fetchPosts(1, category, sort, true);
      fetchBest();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [category, sort, fetchPosts, fetchBest]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setPage(1);
        fetchPosts(1, category, sort, true);
        fetchBest();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [category, sort, fetchPosts, fetchBest]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, category, sort, false);
  }

  useEffect(() => {
    function handleScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (!loading && hasMore) {
          loadMore();
        }
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, category, sort]);

  return (
    <div>
      <Header />

      <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
        <div onClick={() => router.push('/notice')} style={{
          minWidth: '200px',
          background: 'linear-gradient(135deg, #1b4797 0%, #2d6bc4 100%)',
          borderRadius: '12px',
          padding: '16px',
          color: 'white',
          flex: '0 0 auto',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '6px' }}>공지사항</div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>라운지에 오신 것을 환영합니다!</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>사장님들의 솔직한 이야기 공간</div>
        </div>
        <div style={{
          minWidth: '200px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          padding: '16px',
          color: 'white',
          flex: '0 0 auto'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '6px' }}>이벤트</div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>베스트 글 커피 기프티콘!</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>매주 추천 1등에게 드려요</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', padding: '8px 16px 16px', overflowX: 'auto' }}>
        {[
          { icon: '🏠', label: '염광사 홈', url: '#' },
          { icon: '🗺️', label: '로드맵', url: '#' },
          { icon: '🎨', label: '디자인신청', url: '#' },
          { icon: '📰', label: '카드뉴스', url: '#' },
          { icon: '📋', label: '주간뉴스', url: '#' },
          { icon: '🏛️', label: '정부지원', url: '#' }
        ].map((item, i) => (
          <a key={i} href={item.url} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            minWidth: '60px',
            textDecoration: 'none'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#f0f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

      {bestPosts.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: '#333' }}>🔥 이번 주 베스트</div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {bestPosts.map((post, i) => (
              <div key={post.id} onClick={() => router.push('/post/' + post.id)} style={{
                minWidth: '160px',
                background: '#f8f9fa',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                flex: '0 0 auto'
              }}>
                <div style={{ fontSize: '11px', color: '#1b4797', fontWeight: 700, marginBottom: '4px' }}>#{i + 1} {post.category}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>❤️ {post.likeCount} 💬 {post.commentCount}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: '8px', background: '#f0f1f3' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 0' }}>
        <CategoryFilter current={category} onChange={setCategory} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{
          padding: '6px 10px',
          fontSize: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          background: 'white',
          color: '#333',
          flexShrink: 0
        }}>
          <option value="latest">최신순</option>
          <option value="likes">추천순</option>
          <option value="comments">댓글순</option>
        </select>
      </div>

      <div className='post-list'>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {loading && <div className='loading'>로딩 중...</div>}
        {!loading && posts.length === 0 && <div className='empty'>아직 글이 없습니다</div>}
      </div>
      <WriteButton />
    </div>
  );
}
