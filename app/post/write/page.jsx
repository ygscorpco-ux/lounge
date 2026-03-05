'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) return r.json();
      return null;
    }).then(data => {
      if (data && data.user && data.user.role === 'admin') setIsAdmin(true);
    });
  }, []);

  async function handleSubmit() {
    setError('');
    if (!title.trim()) { setError('제목을 입력해주세요'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요'); return; }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: '자유',
        title,
        content,
        isNotice: isAdmin ? isNotice : false
      })
    });

    const data = await res.json();
    if (res.ok) router.push('/');
    else setError(data.error || '작성 실패');
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      zIndex: 200,
    }}>
      {/* 고정 상단바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
        background: '#fff', flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', padding: '4px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
            stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#333' }}>글 쓰기</span>
        <button onClick={handleSubmit} style={{
          background: 'none', border: 'none', fontSize: '15px',
          color: (title.trim() && content.trim()) ? '#1b4797' : '#ccc',
          fontWeight: 600, cursor: 'pointer',
        }}>
          완료
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px 16px', background: '#fff5f5',
          color: '#e53e3e', fontSize: '13px', flexShrink: 0,
        }}>
          {error}
        </div>
      )}

      {/* 스크롤 영역 — 이제 부모가 fixed+고정높이이므로 정상 동작 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* 관리자 공지 옵션 */}
        {isAdmin && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            fontSize: '14px', color: '#333', flexShrink: 0,
          }}>
            <input
              type="checkbox"
              checked={isNotice}
              onChange={(e) => setIsNotice(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#1b4797' }}
            />
            공지로 등록
          </label>
        )}

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목을 입력해주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: '18px 16px 14px', border: 'none',
            borderBottom: '1px solid #f0f0f0',
            fontSize: '18px', fontWeight: 600, color: '#1a1a1a',
            outline: 'none', background: 'transparent', flexShrink: 0,
          }}
        />

        {/* 내용 */}
        <textarea
          placeholder={'염광사 회원님들과 자유롭게 얘기해보세요.\n#매출고민 #직원관리 #운영노하우'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            flex: 1, padding: '16px', border: 'none',
            fontSize: '15px', lineHeight: 1.7, color: '#333',
            outline: 'none', resize: 'none',
            background: 'transparent', minHeight: '200px',
          }}
        />

        {/* 이용규칙 */}
        <div style={{ padding: '20px 16px 32px', flexShrink: 0 }}>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#bbb', lineHeight: 1.8, marginBottom: '10px' }}>
              커뮤니티 이용규칙에 의해 정해진 게시물 게재 제한을 위반할 경우,
              게시물이 삭제되고 서비스 이용이 일정 기간 제한될 수 있습니다.
            </p>
            <p style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.7 }}>
              · 광고/홍보 목적의 게시물 작성 금지<br/>
              · 정치·사회적 의견, 주장을 드러내는 행위 금지<br/>
              · 욕설, 비하, 차별, 혐오, 음란물 등 불쾌감을 주는 행위 금지<br/>
              · 타인의 권리를 침해하는 행위 금지<br/>
              · 불법촬영물 유통 시 관련 법률에 의거 처벌
            </p>
            <button onClick={() => router.push('/rules')} style={{
              background: 'none', border: 'none', padding: '0',
              fontSize: '11px', color: '#bbb', cursor: 'pointer',
              marginTop: '8px', textDecoration: 'underline',
            }}>
              커뮤니티 이용규칙 전체 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
