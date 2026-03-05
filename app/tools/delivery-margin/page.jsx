'use client';
import { useRouter } from 'next/navigation';
import DeliveryMarginCalculator from '../../../components/tools/DeliveryMarginCalculator.jsx';
import ToolHeader from '../../../components/tools/ToolHeader.jsx';

export default function DeliveryMarginPage() {
  const router = useRouter();
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">실마진 계산기</span>
      </div>
      <ToolHeader
        icon={<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="2"/><circle cx="20" cy="20" r="2"/><path d="M1 3h3l2.5 11h11l2.5-8H7"/><path d="M16 10v5M18 12h-4"/></svg>}
        title="실마진 계산기"
        sub="배달앱 수수료까지 한번에 정확하게"
        badge={`배민·쿠팡·요기요`}
      />
      <DeliveryMarginCalculator />
    </div>
  );
}
