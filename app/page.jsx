'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import PostCard from '../components/PostCard.jsx';
import WriteButton from '../components/WriteButton.jsx';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  async function fetchPosts(p, cat, reset) {
    setLoading(true);
    try {
      let url = '/api/posts?page=' + p;
      if (cat) url += '&category=' + cat;
      const res = await fetch(url);
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
  }

  useEffect(() => {
    setPage(1);
    fetchPosts(1, category, true);
  }, [category]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, category, false);
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
  }, [loading, hasMore, page, category]);

  return (
    <div>
      <Header />

      {/* 공지 배너 영역 */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
        <div style={{
          minWidth: '200px',
          background: 'linear-gradient(135deg, #1b4797 0%, #2d6bc4 100%)',
          borderRadius: '12px',
          padding: '16px',
          color: 'white',
          flex: '0 0 auto'
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

      {/* 바로가기 아이콘 영역 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '8px 16px 16px',
        overflowX: 'auto'
      }}>
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

      {/* 구분선 */}
      <div style={{ height: '8px', background: '#f0f1f3' }}></div>

      {/* 카테고리 필터 */}
      <CategoryFilter current={category} onChange={setCategory} />

      {/* 글 목록 */}
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