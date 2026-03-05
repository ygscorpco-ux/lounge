'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveryMarginPage() {
  const router = useRouter();

  // 입력값 state
  const [menuPrice, setMenuPrice] = useState('');
  const [foodCost, setFoodCost] = useState('');
  const [platformFee, setPlatformFee] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [packagingCost, setPackagingCost] = useState('');
  const [result, setResult] = useState(null);

  function calculate() {
    const price = parseFloat(menuPrice) || 0;
    const food = parseFloat(foodCost) || 0;
    const platform = parseFloat(platformFee) || 0;
    const delivery = parseFloat(deliveryFee) || 0;
    const packaging = parseFloat(packagingCost) || 0;

    const totalCost = food + platform + delivery + packaging;
    const margin = price - totalCost;
    // 마진율: 마진 / 메뉴가격 × 100
    const marginRate = price > 0 ? ((margin / price) * 100).toFixed(1) : 0;

    setResult({ margin, marginRate, totalCost });
  }

  function reset() {
    setMenuPrice(''); setFoodCost(''); setPlatformFee('');
    setDeliveryFee(''); setPackagingCost(''); setResult(null);
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: '15px',
    border: '1.5px solid var(--color-gray-300)', borderRadius: 'var(--radius-sm)',
    background: '#fff', marginBottom: '10px', outline: 'none',
    fontFamily: 'inherit',
  };
  const labelStyle = {
    fontSize: 'var(--font-size-sm)', fontWeight: 600,
    color: 'var(--color-gray-700)', marginBottom: '4px', display: 'block',
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      {/* 상단 바 */}
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">실마진 계산기</span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* 설명 카드 */}
        <div style={{
          background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', marginBottom: '20px',
          border: '1px solid #d0dcf5', fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)', lineHeight: 1.6,
        }}>
          배달 앱 주문 시 실제 남는 마진을 계산합니다.<br/>
          메뉴 가격에서 원재료비, 플랫폼 수수료, 배달비, 포장비를 빼면 실마진이 나옵니다.
        </div>

        {/* 입력 폼 */}
        <div style={{
          background: '#fff', borderRadius: 'var(--radius-lg)',
          padding: '20px', marginBottom: '16px',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
        }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '16px' }}>
            📋 정보 입력
          </div>

          <label style={labelStyle}>메뉴 판매가 (원)</label>
          <input style={inputStyle} type="number" placeholder="예: 15000" value={menuPrice}
            onChange={e => setMenuPrice(e.target.value)} inputMode="numeric"/>

          <label style={labelStyle}>원재료비 (원)</label>
          <input style={inputStyle} type="number" placeholder="예: 4000" value={foodCost}
            onChange={e => setFoodCost(e.target.value)} inputMode="numeric"/>

          <label style={labelStyle}>플랫폼 수수료 (원) — 배달의민족·쿠팡이츠 등</label>
          <input style={inputStyle} type="number" placeholder="예: 1500" value={platformFee}
            onChange={e => setPlatformFee(e.target.value)} inputMode="numeric"/>

          <label style={labelStyle}>배달대행비 (원)</label>
          <input style={inputStyle} type="number" placeholder="예: 3500" value={deliveryFee}
            onChange={e => setDeliveryFee(e.target.value)} inputMode="numeric"/>

          <label style={labelStyle}>포장재비 (원)</label>
          <input style={inputStyle} type="number" placeholder="예: 300" value={packagingCost}
            onChange={e => setPackagingCost(e.target.value)} inputMode="numeric"/>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={calculate}
              style={{
                flex: 1, padding: '13px', background: 'var(--color-primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-base)', fontWeight: 700, cursor: 'pointer',
              }}
            >
              계산하기
            </button>
            <button
              onClick={reset}
              style={{
                padding: '13px 18px', background: 'var(--color-gray-100)',
                color: 'var(--color-gray-700)', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-base)', fontWeight: 600, cursor: 'pointer',
              }}
            >
              초기화
            </button>
          </div>
        </div>

        {/* 결과 */}
        {result && (
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-lg)',
            padding: '20px', boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-gray-200)',
          }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '16px' }}>
              📊 계산 결과
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                <span>총 비용</span>
                <span style={{ fontWeight: 600 }}>{result.totalCost.toLocaleString()}원</span>
              </div>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: result.margin >= 0 ? '#f0faf4' : '#fff0f0',
              }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>실마진</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '22px', fontWeight: 800,
                    color: result.margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}>
                    {result.margin.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
                    마진율 {result.marginRate}%
                  </div>
                </div>
              </div>

              {/* 마진율 경고 */}
              {result.margin < 0 && (
                <div style={{ fontSize: '13px', color: 'var(--color-danger)', padding: '8px 12px', background: '#fff0f0', borderRadius: '8px' }}>
                  ⚠️ 손해가 발생하고 있어요. 가격 또는 원가를 조정해보세요.
                </div>
              )}
              {result.margin >= 0 && result.marginRate < 20 && (
                <div style={{ fontSize: '13px', color: 'var(--color-warning)', padding: '8px 12px', background: '#fff8ec', borderRadius: '8px' }}>
                  💡 마진율이 20% 미만이에요. 원가 절감을 고려해보세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
