'use client';
import { useState, useEffect, useRef } from 'react';

// 수수료율에 따른 색상 결정
function getFeeColor(rate) {
  if (rate >= 7) return '#ff4757';
  if (rate >= 4) return '#ffa502';
  return '#2ed573';
}

// 현재 시각 포맷 (HH:MM:SS)
function formatTime(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// 카운트업 훅 — 0에서 target까지 1초에 걸쳐 올라가는 효과
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !target) return;
    started.current = true;
    const steps = 20;
    const step = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(timer); }
      else setVal(cur);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// 개별 플랫폼 티커 셀 — 총부담률(중개+결제) 표시 + 툴팁
function PlatformTicker({ platform }) {
  const [displayRate, setDisplayRate] = useState(null);
  const [flash, setFlash] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // 기본 구간의 중개 + 결제 수수료 합산
  const defaultTier = platform?.tiers?.find(t => t.is_default) ?? platform?.tiers?.[0];
  const baseFee     = parseFloat(defaultTier?.fee_rate || 0);
  const basePayFee  = parseFloat(defaultTier?.payment_fee_rate || 0);
  const totalRate   = baseFee + basePayFee; // 총부담률

  const countedRate = useCountUp(totalRate, 1500); // 1.5초 카운트업
  const feeColor    = getFeeColor(totalRate);

  useEffect(() => {
    if (!totalRate) return;
    const t = setTimeout(() => setDisplayRate(totalRate), 1000);
    return () => clearTimeout(t);
  }, [totalRate]);

  // 3~7초 랜덤 ±0.1% 미세 깜빡임 (시각적 활성감)
  useEffect(() => {
    if (!displayRate) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.2;
      setDisplayRate(prev => parseFloat((prev + delta).toFixed(1)));
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [displayRate]);

  const shown = displayRate ?? countedRate;
  const isUp  = displayRate && displayRate > totalRate;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', minWidth: '80px', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
      onTouchStart={() => setShowTip(v => !v)}
    >
      <span style={{ fontSize: '10px', color: '#8899aa', fontWeight: 600, marginBottom: '2px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
        {platform?.name?.slice(0, 3) || '---'}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: flash ? (isUp ? '#ff6b81' : '#2ed573') : feeColor, transition: 'color 0.2s', letterSpacing: '0.5px' }}>
        {shown > 0 ? shown.toFixed(1) : '..'}%
      </span>
      <span style={{ fontSize: '9px', color: '#556677', fontFamily: 'monospace', marginTop: '1px' }}>
        총부담률
      </span>
      {/* 툴팁: 중개/결제 수수료 분리 표시 */}
      {showTip && totalRate > 0 && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#1e2a3a', color: '#cdd8e8', fontSize: '11px', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', lineHeight: 1.6 }}>
          <div>중개 <strong style={{ color: '#ffa502' }}>{baseFee.toFixed(1)}%</strong></div>
          <div>결제 <strong style={{ color: '#ffa502' }}>{basePayFee.toFixed(1)}%</strong></div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px' }}>
            합계 <strong style={{ color: '#7fdbff' }}>{totalRate.toFixed(1)}%</strong> <span style={{ opacity: 0.6 }}>(부가세 별도)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeeMonitorHeader() {
  const [now, setNow] = useState(new Date());
  const [platforms, setPlatforms] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 1초마다 시계 업데이트
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 모바일 여부 감지
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // /api/delivery-fees 호출 — 5분마다 재fetch
  async function fetchFees() {
    try {
      const res = await fetch('/api/delivery-fees?t=' + Date.now());
      const data = await res.json();
      if (data.success) {
        setPlatforms(data.data || []);
        setLastUpdated(data.lastUpdated);
        setConnected(true);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
      setConnected(false);
    }
  }

  useEffect(() => {
    fetchFees();
    const t = setInterval(fetchFees, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const lastUpdateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '---';

  return (
    <div style={{
      background: '#0a0e1a',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      userSelect: 'none',
    }}>
      {/* 영역1: LIVE 인디케이터 + 시각 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '32px', padding: '0 12px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="fee-live-dot" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff4757', fontFamily: 'monospace', letterSpacing: '1px' }}>
            LIVE
          </span>
          <span style={{ fontSize: '10px', color: '#445566', fontFamily: 'monospace' }}>
            배달앱 수수료 모니터
          </span>
        </div>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: '#7fdbff',
          fontFamily: 'monospace', letterSpacing: '1px',
        }}>
          {formatTime(now)}
        </span>
      </div>

      {/* 영역2: 플랫폼 티커 */}
      {isMobile ? (
        // 모바일: 2×2 그리드
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '1px', padding: '4px',
        }}>
          {platforms.slice(0, 4).map(p => (
            <PlatformTicker key={p.platform_id} platform={p} />
          ))}
        </div>
      ) : (
        // 데스크톱: 가로 1줄
        <div style={{ display: 'flex', alignItems: 'stretch', height: '52px' }}>
          {platforms.map(p => (
            <PlatformTicker key={p.platform_id} platform={p} />
          ))}
          {/* 범례 */}
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center',
            gap: '10px', padding: '0 12px',
          }}>
            {[['7%↑', '#ff4757'], ['4~7%', '#ffa502'], ['4%↓', '#2ed573']].map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '10px', color: '#556677', fontFamily: 'monospace' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 영역3: 상태 바 + 뉴스 티커 */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '28px',
        padding: '0 12px', borderTop: '1px solid rgba(255,255,255,0.04)',
        gap: '12px',
      }}>
        <span style={{
          fontSize: '9px', fontFamily: 'monospace', flexShrink: 0,
          color: connected ? '#2ed573' : '#ff4757',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: connected ? '#2ed573' : '#ff4757',
            display: 'inline-block',
          }} />
          {connected ? 'CONNECTED' : error ? 'ERROR' : 'LOADING'}
        </span>

        <span style={{ fontSize: '9px', color: '#334455', fontFamily: 'monospace', flexShrink: 0 }}>
          UPD {lastUpdateStr}
        </span>

        {/* 흐르는 뉴스 티커 (모바일에선 숨김) */}
        {!isMobile && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <span className="fee-marquee" style={{
              fontSize: '10px', color: '#556677',
              fontFamily: 'monospace', whiteSpace: 'nowrap',
            }}>
              ★ 배달의민족 영세사업자 2% 수수료 혜택 적용중 &nbsp;&nbsp;&nbsp;
              ★ 쿠팡이츠 결제수수료 없음 (2024년 변경) &nbsp;&nbsp;&nbsp;
              ★ 요기요 주문많은 업체 우대 수수료 4.7% &nbsp;&nbsp;&nbsp;
              ★ 땡겨요 전 업체 2% 균일 수수료 &nbsp;&nbsp;&nbsp;
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
