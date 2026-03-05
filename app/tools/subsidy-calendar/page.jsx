'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 주요 지원금 일정 데이터 (추후 DB/API로 교체 예정)
const SUBSIDIES = [
  {
    id: 1, month: 3, day: 31, title: '소상공인 경영안정자금 1분기 신청 마감',
    category: '경영안정', amount: '최대 7,000만원', status: 'warning',
    desc: '소상공인시장진흥공단 운영자금 대출 — 연 2~3% 금리',
    url: 'https://www.semas.or.kr',
  },
  {
    id: 2, month: 4, day: 15, title: '일자리안정자금 2분기 신청',
    category: '인건비', amount: '월 최대 13만원/인', status: 'success',
    desc: '최저임금 인상 부담 완화를 위한 인건비 지원',
    url: 'https://www.ei.go.kr',
  },
  {
    id: 3, month: 4, day: 30, title: '배달환경 개선 지원사업 신청 마감',
    category: '배달', amount: '최대 200만원', status: 'warning',
    desc: '친환경 포장재 전환 소상공인 지원',
    url: '#',
  },
  {
    id: 4, month: 5, day: 10, title: '청년 고용 장려금 신청',
    category: '인건비', amount: '월 80만원 (최대 1년)', status: 'success',
    desc: '청년(15~34세) 신규 채용 시 지원',
    url: 'https://www.work.go.kr',
  },
  {
    id: 5, month: 6, day: 30, title: '소상공인 디지털 전환 바우처',
    category: 'IT·디지털', amount: '최대 400만원', status: 'success',
    desc: 'POS, 키오스크, 배달앱 수수료 지원',
    url: 'https://www.semas.or.kr',
  },
];

const STATUS_COLOR = {
  warning: { bg: '#fff8ec', text: '#f39c12', label: '마감임박' },
  success: { bg: '#f0faf4', text: '#2ecc71', label: '신청가능' },
  danger:  { bg: '#fff0f0', text: '#e74c3c', label: '마감' },
};

const CATEGORY_COLOR = {
  '경영안정': '#1b4797', '인건비': '#4f80e1', '배달': '#f39c12',
  'IT·디지털': '#2ecc71', '전체': '#495057',
};

export default function SubsidyCalendarPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('전체');

  const categories = ['전체', ...Array.from(new Set(SUBSIDIES.map(s => s.category)))];
  const filtered = filter === '전체' ? SUBSIDIES : SUBSIDIES.filter(s => s.category === filter);

  // 오늘 날짜 기준 D-day 계산
  function getDday(month, day) {
    const today = new Date();
    const target = new Date(today.getFullYear(), month - 1, day);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">지원금 일정</span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' }}>

        <div style={{
          background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', marginBottom: '20px',
          border: '1px solid #d0dcf5', fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)', lineHeight: 1.6,
        }}>
          사장님께 유용한 지원금 신청 일정을 모아봤어요.<br/>
          정확한 내용은 해당 기관에서 반드시 확인하세요.
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                background: filter === cat ? 'var(--color-primary)' : 'var(--color-gray-100)',
                color: filter === cat ? '#fff' : 'var(--color-gray-700)',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* 지원금 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(s => {
            const dday = getDday(s.month, s.day);
            const isExpired = dday === '마감';
            const statusColor = isExpired ? STATUS_COLOR.danger : STATUS_COLOR[s.status];

            return (
              <div key={s.id} style={{
                background: '#fff', borderRadius: 'var(--radius-lg)',
                padding: '18px', boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-gray-200)',
                opacity: isExpired ? 0.6 : 1,
              }}>
                {/* 상단 뱃지 줄 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: (CATEGORY_COLOR[s.category] || '#1b4797') + '18',
                    color: CATEGORY_COLOR[s.category] || '#1b4797',
                  }}>
                    {s.category}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    background: statusColor.bg, color: statusColor.text,
                  }}>
                    {dday}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '6px', lineHeight: 1.4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px', lineHeight: 1.5 }}>
                  {s.desc}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    💰 {s.amount}
                  </span>
                  <span style={{ fontSize: '13px', color: '#aaa' }}>
                    ~{s.month}월 {s.day}일
                  </span>
                </div>
                {!isExpired && s.url !== '#' && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'block', marginTop: '12px', padding: '10px',
                      background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)',
                      textAlign: 'center', fontSize: '13px', fontWeight: 600,
                      color: 'var(--color-primary)', textDecoration: 'none',
                    }}>
                    신청 바로가기 →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
