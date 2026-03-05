'use client';
import { useRouter } from 'next/navigation';
import SubsidyCalendar from '../../../components/tools/SubsidyCalendar';
import ToolHeader from '../../../components/tools/ToolHeader.jsx';

export default function SubsidyCalendarPage() {
  const router = useRouter();
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">지원금 캘린더</span>
      </div>
      <ToolHeader
        icon={<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="22" height="20" rx="3"/><path d="M3 11h22M9 3v4M19 3v4"/><path d="M8 17h3M14 17h3M8 21h3"/></svg>}
        title="지원금 캘린더"
        sub="놓치면 아까운 소상공인 지원사업"
        badge="매월 업데이트"
        gradient="linear-gradient(135deg, #1b6297 0%, #2d8fc4 100%)"
      />
      <SubsidyCalendar />
    </div>
  );
}
