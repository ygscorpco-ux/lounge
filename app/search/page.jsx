'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../../components/PostCard.jsx';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  async function handleSearch() {
    if (!keyword.trim()) return;
    const res = await fetch('/api/posts/search?keyword=' + encodeURIComponent(keyword));
    if (res.ok) { const data = await res.json(); setResults(data.posts || []); setSearched(true); }
  }

  return (
    <div>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>검색</span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} placeholder="검색어를 입력하세요" style={{ flex: 1, padding: '10px 14px', borderRadius: '22px', border: '1px solid #e0e0e0', fontSize: '14px', background: '#f8f9fa', outline: 'none' }} />
        <button onClick={handleSearch} style={{ padding: '10px 18px', background: '#1b4797', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 600, fontSize: '14px' }}>검색</button>
      </div>
      {results.map(post => <PostCard key={post.id} post={post} />)}
      {searched && results.length === 0 && <div className='empty'>검색 결과가 없습니다</div>}
    </div>
  );
}
