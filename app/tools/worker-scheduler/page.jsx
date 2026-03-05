'use client';
import { useRouter } from 'next/navigation';
import WorkerScheduler from '../../../components/tools/WorkerScheduler';
import ToolHeader from '../../../components/tools/ToolHeader.jsx';

export default function WorkerSchedulerPage() {
  const router = useRouter();
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">알바 관리</span>
      </div>
      <ToolHeader
        icon={<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="18" height="22" rx="2"/><path d="M9 8h10M9 12h10M9 16h6"/><circle cx="21" cy="21" r="5"/><path d="M21 18v3l2 2"/></svg>}
        title="알바 관리"
        sub="직원 스케줄·급여·계약서 한번에"
        badge="직원관리+급여정산"
        gradient="linear-gradient(135deg, #1b4797 0%, #4f1b97 100%)"
      />
      <WorkerScheduler />
    </div>
  );
}
