'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['매출고민', '직원관리', '운영노하우', '멘탈관리', '마케팅질문'];

export default function WritePage() {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit() {
    setError('');

    if (!category || !title || !content) {
      setError('말머리, 제목, 내용을 모두 입력해주세요');
      return;
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, content })
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/');
    } else {
      setError(data.error || '작성 실패');
    }
  }

  return (
    <div className='write-form'>
      <div className='write-form-header'>
        <button className='back-btn' onClick={() => router.back()} style={{ color: '#333' }}>
          &#x2190;
        </button>
        <div className='write-form-title'>글쓰기</div>
        <button className='write-form-submit' onClick={handleSubmit}>등록</button>
      </div>
      {error && <div className='auth-error' style={{ padding: '12px 16px' }}>{error}</div>}
      <div className='write-form-body'>
        <select
          className='write-category-select'
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value=''>-- 말머리 선택 --</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          className='write-title-input'
          type='text'
          placeholder='제목'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className='write-content-input'
          placeholder='내용을 입력하세요...'
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    </div>
  );
}
