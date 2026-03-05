'use client';
import { useRouter } from 'next/navigation';
import LaborCostCalculator from '../../../components/tools/LaborCostCalculator.jsx';

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
      <LaborCostCalculator />
    </div>
  );
}
