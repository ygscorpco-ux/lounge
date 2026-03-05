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

// 개별 플랫폼 티커 셀
function PlatformTicker({ platform }) {
  const [displayRate, setDisplayRate] = useState(null);
  const [flash, setFlash] = useState(false);
  const baseRate = platform?.tiers?.find(t => t.is_default)?.fee_rate
    ?? platform?.tiers?.[0]?.fee_rate ?? 0;
  const countedRate = useCountUp(parseFloat(baseRate) || 0);
  const feeColor = getFeeColor(parseFloat(baseRate) || 0);

  // 로드 완료 후 displayRate 세팅
  useEffect(() => {
    if (!baseRate) return;
    const t = setTimeout(() => setDisplayRate(parseFloat(baseRate)), 900);
    return () => clearTimeout(t);
  }, [baseRate]);

  // 3~7초 랜덤 ±0.1% 미세 깜빡임
  useEffect(() => {
    if (!displayRate) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.2; // ±0.1
      setDisplayRate(prev => parseFloat((prev + delta).toFixed(1)));
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [displayRate]);

  const shown = displayRate ?? countedRate;
  const isUp = displayRate && displayRate > parseFloat(baseRate);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 10px', minWidth: '80px',
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{
        fontSize: '10px', color: '#8899aa', fontWeight: 600, marginBottom: '2px',
        fontFamily: 'monospace', letterSpacing: '0.5px',
      }}>
        {platform?.name?.slice(0, 3) || '---'}
      </span>
      <span style={{
        fontSize: '13px', fontWeight: 800, fontFamily: 'monospace',
        color: flash ? (isUp ? '#ff6b81' : '#2ed573') : feeColor,
        transition: 'color 0.2s',
        letterSpacing: '0.5px',
      }}>
        {shown > 0 ? shown.toFixed(1) : '..'}%
      </span>
      <span style={{
        fontSize: '9px', color: '#556677', fontFamily: 'monospace', marginTop: '1px',
      }}>
        {shown > 0 ? `+VAT ${(shown * 0.1).toFixed(1)}` : ''}
      </span>
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
