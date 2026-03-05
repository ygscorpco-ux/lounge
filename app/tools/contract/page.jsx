'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ContractGenerator from '../../../components/tools/ContractGenerator';

function ContractPage() {
  const router = useRouter();
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh' }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="top-bar-title">근로계약서 작성</span>
      </div>
      <ContractGenerator />
    </div>
  );
}

export default function ContractPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>로딩 중...</div>}>
      <ContractPage />
    </Suspense>
  );
}
