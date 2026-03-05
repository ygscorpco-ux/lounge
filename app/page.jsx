'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const fetchPosts = useCallback(async (p, cat, s, reset) => {
    setLoading(true);
    try {
      let url = '/api/posts?page=' + p + '&sort=' + s + '&t=' + Date.now();
      if (cat) url += '&category=' + encodeURIComponent(cat);
      const res = await fetch(url);
      const data = await res.json();
      if (reset) setPosts(data.posts || []);
      else setPosts(prev => [...prev, ...(data.posts || [])]);
      setHasMore((data.posts || []).length >= data.pageSize);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchBest = useCallback(async () => {
    try {
      const res = await fetch('/api/posts/best?t=' + Date.now());
      if (res.ok) { const data = await res.json(); setBestPosts(data.posts || []); }
    } catch (e) {}
  }, []);

  useEffect(() => { setPage(1); fetchPosts(1, category, sort, true); fetchBest(); }, [category, sort, refreshKey, fetchPosts, fetchBest]);
  useEffect(() => { const h = () => setRefreshKey(p => p + 1); window.addEventListener('focus', h); window.addEventListener('pageshow', h); return () => { window.removeEventListener('focus', h); window.removeEventListener('pageshow', h); }; }, []);
  useEffect(() => { setRefreshKey(p => p + 1); }, [pathname]);

  function loadMore() { const n = page + 1; setPage(n); fetchPosts(n, category, sort, false); }
  useEffect(() => { const h = () => { if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !loading && hasMore) loadMore(); }; window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, [loading, hasMore, page, category, sort]);

  return (
    <div>
      <Header />

      {/* 배너 */}
      <div className='banner-scroll' style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <div onClick={() => router.push('/notice')} style={{
          minWidth: '220px', background: 'linear-gradient(135deg, #1b4797 0%, #3d7bd8 100%)',
          borderRadius: '14px', padding: '18px', color: 'white', flex: '0 0 auto', cursor: 'pointer'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: 500 }}>공지사항</div>
          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>라운지에 오신 것을<br/>환영합니다!</div>
          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '10px' }}>사장님들의 솔직한 이야기 공간</div>
        </div>
        <div style={{
          minWidth: '220px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '14px', padding: '18px', color: 'white', flex: '0 0 auto'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: 500 }}>이벤트</div>
          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>베스트 글 커피<br/>기프티콘!</div>
          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '10px' }}>매주 추천 1등에게 드려요</div>
        </div>
      </div>

      {/* 바로가기 */}
      <div style={{ display: 'flex', gap: '0', padding: '4px 0 16px', justifyContent: 'space-around' }}>
        {[
          { icon: '🏠', label: '염광사 홈', url: '#' },
          { icon: '🗺️', label: '로드맵', url: '#' },
          { icon: '🎨', label: '디자인신청', url: '#' },
          { icon: '📰', label: '카드뉴스', url: '#' },
          { icon: '📋', label: '주간뉴스', url: '#' },
          { icon: '🏛️', label: '정부지원', url: '#' }
        ].map((item, i) => (
          <a key={i} href={item.url} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {item.icon}
            </div>
            <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.label}</span>
          </a>
        ))}
      </div>

      {/* 베스트 */}
      {bestPosts.length > 0 && (
        <>
          <div className='section-divider' />
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px' }}>🔥 실시간 인기 글</div>
            <div className='best-scroll' style={{ display: 'flex', gap: '10px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {bestPosts.map((post, i) => (
                <div key={post.id} onClick={() => router.push('/post/' + post.id)} style={{
                  minWidth: '180px', background: '#f8f9fa', borderRadius: '12px', padding: '14px',
                  cursor: 'pointer', flex: '0 0 auto', border: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '11px', color: '#1b4797', fontWeight: 700, marginBottom: '6px' }}>#{i + 1} {post.category}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                  <div style={{ fontSize: '11px', color: '#999', display: 'flex', gap: '8px' }}>
                    <span>♥ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className='section-divider' />

      {/* 필터 + 정렬 */}
      <CategoryFilter current={category} onChange={setCategory} sort={sort} onSortChange={setSort} />

      {/* 글 목록 */}
      <div>
        {posts.map(post => <PostCard key={post.id} post={post} />)}
        {loading && <div className='loading'>로딩 중...</div>}
        {!loading && posts.length === 0 && <div className='empty'>아직 글이 없습니다</div>}
      </div>
      <WriteButton />
    </div>
  );
}
