'use client';
import { useRouter } from 'next/navigation';
import SubsidyCalendar from '../../../components/tools/SubsidyCalendar';

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
      <SubsidyCalendar />
    </div>
  );
}
