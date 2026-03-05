'use client';
import { useState, useMemo } from 'react';

// 배달앱별 수수료 설정
const APPS = [
  { id: 'baemin',  name: '배달의민족', color: '#2AC1BC', fee: 6.8  },
  { id: 'coupang', name: '쿠팡이츠',   color: '#C00C1E', fee: 9.8  },
  { id: 'yogiyo',  name: '요기요',     color: '#FA2258', fee: 12.5 },
  { id: 'custom',  name: '직접입력',   color: '#1b4797', fee: null },
];

// 숫자를 천단위 콤마 문자열로 변환
function formatNumber(val) {
  const num = val.replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString() : '';
}

// 콤마 제거 후 숫자 반환
function parseNum(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

// 마진율에 따른 상태 뱃지
function getMarginStatus(rate) {
  if (rate >= 30) return { emoji: '😊', label: '양호', bg: 'rgba(46,204,113,0.25)', color: '#27ae60' };
  if (rate >= 10) return { emoji: '🤔', label: '보통', bg: 'rgba(243,156,18,0.25)',  color: '#e67e22' };
  return            { emoji: '😨', label: '위험', bg: 'rgba(231,76,60,0.25)',   color: '#e74c3c' };
}

// 툴팁 컴포넌트
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '5px' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={() => setShow(v => !v)}
        style={{
          width: '16px', height: '16px', borderRadius: '50%',
          background: 'var(--color-gray-200)', color: 'var(--color-gray-700)',
          fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        ?
      </span>
      {show && (
        <span style={{
          position: 'absolute', bottom: '22px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-gray-900)', color: '#fff',
          fontSize: '11px', padding: '6px 10px', borderRadius: '8px',
          whiteSpace: 'nowrap', zIndex: 100, lineHeight: 1.5,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// 토글 스위치 컴포넌트
function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: on ? 'var(--color-primary)' : 'var(--color-gray-300)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.2s ease',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

export default function DeliveryMarginCalculator() {
  const [selectedApp, setSelectedApp] = useState('baemin');
  const [customFee, setCustomFee] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCost, setMenuCost] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [cardFeeOn, setCardFeeOn] = useState(true);
  const [vatOn, setVatOn] = useState(false);

  // 현재 선택된 앱 객체
  const currentApp = APPS.find(a => a.id === selectedApp);
  // 실제 적용 수수료율
  const feeRate = selectedApp === 'custom' ? (parseFloat(customFee) || 0) : (currentApp?.fee || 0);

  // 실시간 계산 (useMemo로 최적화)
  const calc = useMemo(() => {
    const price    = parseNum(menuPrice);
    const cost     = parseNum(menuCost);
    const delivery = parseNum(deliveryFee);
    if (!price) return null;

    const appFee    = Math.round(price * feeRate / 100);
    const cardFee   = cardFeeOn ? Math.round(price * 0.015) : 0;
    const vatAmount = vatOn ? Math.round(price * 0.1) : 0;
    const totalDeduct = appFee + cardFee + delivery + cost + vatAmount;
    const margin    = price - totalDeduct;
    const marginRate = price > 0 ? (margin / price) * 100 : 0;

    // 시각화 바 비율
    const costRatio     = Math.max(0, (cost     / price) * 100);
    const feeRatio      = Math.max(0, ((appFee + cardFee) / price) * 100);
    const otherRatio    = Math.max(0, ((delivery + vatAmount) / price) * 100);
    const marginRatio   = Math.max(0, (margin   / price) * 100);

    return { price, appFee, cardFee, vatAmount, delivery, cost, margin, marginRate, costRatio, feeRatio, otherRatio, marginRatio };
  }, [menuPrice, menuCost, deliveryFee, feeRate, cardFeeOn, vatOn]);

  // 입력 핸들러 — 자동 천단위 콤마
  function handleNumInput(setter) {
    return (e) => setter(formatNumber(e.target.value));
  }

  const inputStyle = {
    textAlign: 'right', padding: '11px 14px', fontSize: '15px', fontWeight: 600,
    border: '1.5px solid var(--color-gray-300)', borderRadius: 'var(--radius-sm)',
    background: '#fff', outline: 'none', fontFamily: 'inherit', width: '100%',
    transition: 'border-color 0.15s',
  };
  const labelStyle = {
    fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)',
    display: 'flex', alignItems: 'center',
  };
  const rowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '14px',
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px', background: 'var(--color-bg)', minHeight: '100%' }}>

      {/* ── 상단 헤더 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '24px' }}>
        {/* 배달 오토바이 SVG */}
        <div style={{ marginBottom: '12px' }}>
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
            <circle cx="11" cy="35" r="7" stroke="#1b4797" strokeWidth="2.5" fill="#eef2fb"/>
            <circle cx="37" cy="35" r="7" stroke="#1b4797" strokeWidth="2.5" fill="#eef2fb"/>
            <path d="M18 35h10M24 35l-5-14h8l6 9" stroke="#1b4797" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 28l5-8h10" stroke="#4f80e1" strokeWidth="2.2" strokeLinecap="round"/>
            <rect x="22" y="14" width="10" height="7" rx="2" stroke="#4f80e1" strokeWidth="2"/>
            <circle cx="37" cy="35" r="3" fill="#1b4797"/>
            <circle cx="11" cy="35" r="3" fill="#1b4797"/>
          </svg>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-gray-900)' }}>실마진 계산기</div>
        <div style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginTop: '4px' }}>
          배달앱 수수료를 제외한 실제 마진을 계산해요
        </div>
      </div>

      {/* ── 입력 카드 ── */}
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '24px',
        boxShadow: '0 4px 20px rgba(27,71,151,0.08)', marginBottom: '16px',
      }}>

        {/* ① 배달앱 선택 탭 (2×2 그리드) */}
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '10px' }}>
          배달앱 선택
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {APPS.map(app => {
            const active = selectedApp === app.id;
            return (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app.id)}
                style={{
                  padding: '12px 10px', borderRadius: '12px', cursor: 'pointer',
                  border: active ? `2px solid ${app.color}` : '1.5px solid var(--color-gray-200)',
                  background: active ? `${app.color}18` : 'var(--color-gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* 앱 컬러 포인트 원 */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? app.color : 'var(--color-gray-700)' }}>
                    {app.name}
                  </span>
                </div>
                {active
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill={app.color}/><path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>
                      {app.fee !== null ? `${app.fee}%` : '직접'}
                    </span>
                }
              </button>
            );
          })}
        </div>

        {/* 직접입력 시 수수료율 입력 필드 */}
        {selectedApp === 'custom' && (
          <div style={{ ...rowStyle, marginTop: '-10px' }}>
            <label style={labelStyle}>
              수수료율 <Tooltip text="배달앱에서 청구하는 중개 수수료율을 입력하세요" />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '130px' }}>
              <input
                style={{ ...inputStyle, width: '90px' }}
                type="number" placeholder="0.0" value={customFee}
                onChange={e => setCustomFee(e.target.value)} inputMode="decimal"
              />
              <span style={{ fontSize: '14px', color: 'var(--color-gray-500)', fontWeight: 600 }}>%</span>
            </div>
          </div>
        )}

        {/* ② 입력 필드 3개 */}
        <div style={rowStyle}>
          <label style={labelStyle}>
            메뉴 판매가
            <Tooltip text="고객이 실제로 결제하는 메뉴 가격" />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '150px' }}>
            <input style={inputStyle} type="text" inputMode="numeric"
              placeholder="15,000" value={menuPrice} onChange={handleNumInput(setMenuPrice)}/>
            <span style={{ fontSize: '13px', color: 'var(--color-gray-500)', fontWeight: 600, flexShrink: 0 }}>원</span>
          </div>
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>
            메뉴 원가
            <Tooltip text="재료비, 포장재 등 해당 메뉴를 만드는 데 드는 비용" />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '150px' }}>
            <input style={inputStyle} type="text" inputMode="numeric"
              placeholder="5,000" value={menuCost} onChange={handleNumInput(setMenuCost)}/>
            <span style={{ fontSize: '13px', color: 'var(--color-gray-500)', fontWeight: 600, flexShrink: 0 }}>원</span>
          </div>
        </div>

        <div style={{ ...rowStyle, marginBottom: 0 }}>
          <label style={labelStyle}>
            배달비 부담
            <Tooltip text="사장님이 직접 부담하는 배달대행비. 고객 부담이면 0원 입력" />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '150px' }}>
            <input style={inputStyle} type="text" inputMode="numeric"
              placeholder="0" value={deliveryFee} onChange={handleNumInput(setDeliveryFee)}/>
            <span style={{ fontSize: '13px', color: 'var(--color-gray-500)', fontWeight: 600, flexShrink: 0 }}>원</span>
          </div>
        </div>

        {/* ③ 토글 스위치 2개 */}
        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--color-gray-200)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              카드수수료 포함
              <span style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginLeft: '5px' }}>(1.5%)</span>
            </span>
            <Toggle on={cardFeeOn} onChange={setCardFeeOn} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              부가세 포함
              <span style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginLeft: '5px' }}>(10%)</span>
            </span>
            <Toggle on={vatOn} onChange={setVatOn} />
          </div>
        </div>
      </div>

      {/* ── 결과 카드 ── */}
      {!calc ? (
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '28px 24px',
          boxShadow: '0 4px 20px rgba(27,71,151,0.08)',
          textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '14px',
        }}>
          메뉴 판매가를 입력하면 마진이 계산됩니다
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1b4797 0%, #2d5fc4 100%)',
          borderRadius: '20px', padding: '28px 24px', color: '#fff',
          animation: 'fadeSlideUp 0.25s ease',
        }}>

          {/* ① 실마진 BIG 표시 */}
          <div style={{ marginBottom: '4px', fontSize: '13px', opacity: 0.8 }}>실수령 마진</div>
          <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '10px' }}>
            ₩ {calc.margin.toLocaleString()}
          </div>

          {/* 마진율 뱃지 */}
          {(() => {
            const status = getMarginStatus(calc.marginRate);
            return (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '20px',
                background: status.bg, marginBottom: '20px',
              }}>
                <span style={{ fontSize: '14px' }}>{status.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {calc.marginRate.toFixed(1)}% {status.label}
                </span>
              </div>
            );
          })()}

          {/* ② 구분선 */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '18px' }} />

          {/* ③ 항목별 차감 내역 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { icon: '📦', label: '판매가',        amount: calc.price,    sign: '+', sub: null },
              { icon: '🏪', label: '배달앱 수수료', amount: calc.appFee,   sign: '-', sub: `${feeRate}%` },
              ...(cardFeeOn ? [{ icon: '💳', label: '카드수수료', amount: calc.cardFee, sign: '-', sub: '1.5%' }] : []),
              ...(calc.delivery > 0 ? [{ icon: '🛵', label: '배달비 부담', amount: calc.delivery, sign: '-', sub: null }] : []),
              ...(vatOn ? [{ icon: '🧾', label: '부가세', amount: calc.vatAmount, sign: '-', sub: '10%' }] : []),
              { icon: '🥘', label: '원가',           amount: calc.cost,    sign: '-', sub: null },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ opacity: 0.85 }}>{item.icon} {item.label}{item.sub && <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>({item.sub})</span>}</span>
                <span style={{ fontWeight: 600 }}>
                  {item.sign === '+' ? '+' : '-'}{item.amount.toLocaleString()}원
                </span>
              </div>
            ))}

            {/* 합계 구분선 + 실마진 */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '2px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
              <span>✅ 실마진</span>
              <span>{calc.margin.toLocaleString()}원</span>
            </div>
          </div>

          {/* ④ 시각화 바 */}
          <div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${calc.costRatio}%`,   background: '#e74c3c', transition: 'width 0.3s ease' }} />
              <div style={{ width: `${calc.feeRatio}%`,    background: '#f39c12', transition: 'width 0.3s ease' }} />
              <div style={{ width: `${calc.otherRatio}%`,  background: '#adb5bd', transition: 'width 0.3s ease' }} />
              <div style={{ width: `${calc.marginRatio}%`, background: '#2ecc71', transition: 'width 0.3s ease' }} />
            </div>
            {/* 범례 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { color: '#e74c3c', label: '원가' },
                { color: '#f39c12', label: '수수료' },
                { color: '#adb5bd', label: '기타공제' },
                { color: '#2ecc71', label: '실마진' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
