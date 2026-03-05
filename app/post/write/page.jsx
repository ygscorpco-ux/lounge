'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRules, setShowRules] = useState(false);
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* 고정 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
        background: '#fff', flexShrink: 0, zIndex: 10
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
        }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#333' }}>글 쓰기</span>
        <button onClick={handleSubmit} style={{
          background: 'none', border: 'none', fontSize: '15px',
          color: (title.trim() && content.trim()) ? '#1b4797' : '#ccc',
          fontWeight: 600, cursor: 'pointer'
        }}>
          완료
        </button>
      </div>

      {error && <div style={{ padding: '10px 16px', background: '#fff5f5', color: '#e53e3e', fontSize: '13px', flexShrink: 0 }}>{error}</div>}

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* 관리자 공지 옵션 */}
        {isAdmin && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333', flexShrink: 0
          }}>
            <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#1b4797' }} />
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
            padding: '18px 16px 14px', border: 'none', borderBottom: '1px solid #f0f0f0',
            fontSize: '18px', fontWeight: 600, color: '#1a1a1a', outline: 'none',
            background: 'transparent', flexShrink: 0
          }}
        />

        {/* 내용 */}
        <textarea
          placeholder={'염광사 회원님들과 자유롭게 얘기해보세요.\n#매출고민 #직원관리 #운영노하우'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            flex: 1, padding: '16px', border: 'none', fontSize: '15px',
            lineHeight: 1.7, color: '#333', outline: 'none', resize: 'none',
            background: 'transparent', minHeight: '200px'
          }}
        />

        {/* 이용규칙 */}
        <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
          <button onClick={() => setShowRules(!showRules)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            width: '100%', padding: '10px', background: '#f8f9fa', border: '1px solid #e8e8e8',
            borderRadius: '8px', fontSize: '13px', color: '#666', cursor: 'pointer'
          }}>
            커뮤니티 이용규칙 전체 보기
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <polyline points={showRules ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
            </svg>
          </button>

          {showRules && (
            <div style={{
              marginTop: '10px', padding: '16px', background: '#f8f9fa',
              borderRadius: '8px', fontSize: '13px', color: '#555', lineHeight: 1.8
            }}>
              <p style={{ marginBottom: '12px' }}>
                라운지는 자영업자 사장님들이 기분 좋게 소통할 수 있는 커뮤니티를 만들기 위해
                이용규칙을 제정하여 운영하고 있습니다. 위반 시 게시물이 삭제되고 서비스 이용이
                일정 기간 제한될 수 있습니다.
              </p>
              <p style={{ marginBottom: '8px', fontWeight: 700, color: '#333' }}>※ 광고·홍보 관련 행위 금지</p>
              <p style={{ marginBottom: '12px' }}>
                - 영리 여부와 관계 없이 사업체·기관·단체·개인에게 직간접적으로 영향을 줄 수 있는 게시물 작성 행위<br/>
                - 바이럴 홍보 및 명칭·단어 언급 행위
              </p>
              <p style={{ marginBottom: '8px', fontWeight: 700, color: '#333' }}>※ 정치·사회 관련 행위 금지</p>
              <p style={{ marginBottom: '12px' }}>
                - 정치 관련 단체, 언론, 시민단체에 대한 언급 혹은 이와 관련한 행위<br/>
                - 정책·외교 또는 정치·정파에 대한 의견, 주장 및 이념, 가치관을 드러내는 행위
              </p>
              <p style={{ marginBottom: '8px', fontWeight: 700, color: '#333' }}>※ 불쾌감을 주는 행위 금지</p>
              <p style={{ marginBottom: '12px' }}>
                - 욕설, 비하, 차별, 혐오, 자살, 폭력 관련 내용을 포함한 게시물 작성 행위<br/>
                - 음란물, 성적 수치심을 유발하는 행위<br/>
                - 타인의 권리를 침해하거나 불쾌감을 주는 행위
              </p>
              <p style={{ marginBottom: '8px', fontWeight: 700, color: '#333' }}>※ 불법촬영물 유통 금지</p>
              <p>
                불법촬영물등을 게재할 경우 관련 법률에 의거하여 삭제 조치 및 서비스 이용이
                영구적으로 제한될 수 있으며 관련 법률에 기반하여 처벌받을 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
