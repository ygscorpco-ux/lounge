'use client';
import { useRouter } from 'next/navigation';
import LaborCostCalculator from '../../../components/tools/LaborCostCalculator.jsx';
import ToolHeader from '../../../components/tools/ToolHeader.jsx';

export default function LaborCostPage() {
  const router = useRouter();
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">인건비 계산기</span>
      </div>
      <ToolHeader
        icon={<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="9" r="5"/><path d="M2 26c0-5 4-9 9-9"/><circle cx="21" cy="21" r="6"/><path d="M21 17v8M17 21h8"/></svg>}
        title="인건비 계산기"
        badge="2026 기준"
      />
      <LaborCostCalculator />
    </div>
  );
}
