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
    if (res.ok) {
      const data = await res.json();
      setResults(data.posts || []);
      setSearched(true);
    }
  }

  return (
    <div>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>검색</span>
      </div>
      <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="검색어를 입력하세요"
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
        />
        <button onClick={handleSearch} style={{ padding: '10px 16px', background: '#1b4797', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>검색</button>
      </div>
      <div>
        {results.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );
}
