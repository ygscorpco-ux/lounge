'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2025년 최저시급 기준
const MIN_WAGE_2025 = 10030;

export default function LaborCostPage() {
  const router = useRouter();

  const [workers, setWorkers] = useState([{ id: 1, name: '', hourlyWage: '', hoursPerDay: '', daysPerMonth: '' }]);
  const [result, setResult] = useState(null);

  function addWorker() {
    setWorkers(prev => [...prev, { id: Date.now(), name: '', hourlyWage: '', hoursPerDay: '', daysPerMonth: '' }]);
  }
  function removeWorker(id) {
    setWorkers(prev => prev.filter(w => w.id !== id));
  }
  function updateWorker(id, field, value) {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function calculate() {
    const results = workers.map(w => {
      const wage = parseFloat(w.hourlyWage) || MIN_WAGE_2025;
      const hours = parseFloat(w.hoursPerDay) || 0;
      const days = parseFloat(w.daysPerMonth) || 0;
      // 월 급여 = 시급 × 일일근무시간 × 월근무일수
      const monthly = wage * hours * days;
      // 주휴수당: 주 15시간 이상 근무 시 발생 (주당 근무시간 ÷ 40 × 8 × 시급 × 4주)
      const weeklyHours = (hours * days) / (days / 4);
      const weeklyAllowance = weeklyHours >= 15 ? (weeklyHours / 40) * 8 * wage * 4 : 0;
      // 4대보험 사업주 부담 (약 9.7%)
      const insurance = (monthly + weeklyAllowance) * 0.097;
      const total = monthly + weeklyAllowance + insurance;
      return { name: w.name || '직원', monthly, weeklyAllowance, insurance, total };
    });
    const grandTotal = results.reduce((s, r) => s + r.total, 0);
    setResult({ results, grandTotal });
  }

  function reset() { setWorkers([{ id: 1, name: '', hourlyWage: '', hoursPerDay: '', daysPerMonth: '' }]); setResult(null); }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '1.5px solid var(--color-gray-300)', borderRadius: 'var(--radius-sm)',
    background: '#fff', outline: 'none', fontFamily: 'inherit',
  };

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

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' }}>

        <div style={{
          background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', marginBottom: '20px',
          border: '1px solid #d0dcf5', fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)', lineHeight: 1.6,
        }}>
          2025년 최저시급 <strong>10,030원</strong> 기준.<br/>
          주휴수당 + 4대보험 사업주 부담분(9.7%)이 자동 계산됩니다.
        </div>

        {/* 직원 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {workers.map((w, idx) => (
            <div key={w.id} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)',
              padding: '16px', boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-gray-200)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>직원 {idx + 1}</span>
                {workers.length > 1 && (
                  <button onClick={() => removeWorker(w.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    삭제
                  </button>
                )}
              </div>
              <input style={{ ...inputStyle, marginBottom: '8px' }} type="text" placeholder="이름 (선택)"
                value={w.name} onChange={e => updateWorker(w.id, 'name', e.target.value)}/>
              <input style={{ ...inputStyle, marginBottom: '8px' }} type="number" placeholder={`시급 (기본: ${MIN_WAGE_2025.toLocaleString()}원)`}
                value={w.hourlyWage} onChange={e => updateWorker(w.id, 'hourlyWage', e.target.value)} inputMode="numeric"/>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="일 근무시간"
                  value={w.hoursPerDay} onChange={e => updateWorker(w.id, 'hoursPerDay', e.target.value)} inputMode="numeric"/>
                <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="월 근무일수"
                  value={w.daysPerMonth} onChange={e => updateWorker(w.id, 'daysPerMonth', e.target.value)} inputMode="numeric"/>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addWorker}
          style={{
            width: '100%', padding: '12px', background: 'var(--color-primary-bg)',
            color: 'var(--color-primary)', border: '1.5px dashed var(--color-accent)',
            borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', marginBottom: '16px',
          }}>
          + 직원 추가
        </button>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={calculate}
            style={{
              flex: 1, padding: '13px', background: 'var(--color-primary)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-base)', fontWeight: 700, cursor: 'pointer',
            }}>
            계산하기
          </button>
          <button onClick={reset}
            style={{
              padding: '13px 18px', background: 'var(--color-gray-100)',
              color: 'var(--color-gray-700)', border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-base)', fontWeight: 600, cursor: 'pointer',
            }}>
            초기화
          </button>
        </div>

        {/* 결과 */}
        {result && (
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-lg)',
            padding: '20px', boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-gray-200)',
          }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>📊 계산 결과</div>
            {result.results.map((r, i) => (
              <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>{r.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                  <span>기본 월급</span><span>{Math.round(r.monthly).toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                  <span>주휴수당</span><span>{Math.round(r.weeklyAllowance).toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                  <span>4대보험(사업주)</span><span>{Math.round(r.insurance).toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                  <span>실 부담 합계</span><span style={{ color: 'var(--color-primary)' }}>{Math.round(r.total).toLocaleString()}원</span>
                </div>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'var(--color-primary-bg)',
              borderRadius: 'var(--radius-sm)', marginTop: '4px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>월 총 인건비</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {Math.round(result.grandTotal).toLocaleString()}원
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
