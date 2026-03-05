'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const COLORS = ['#1b4797', '#4f80e1', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

const MIN_WAGE = 10030;

export default function WorkerSchedulerPage() {
  const router = useRouter();

  const [workers, setWorkers] = useState([
    { id: 1, name: '직원1', hourlyWage: MIN_WAGE, color: COLORS[0], schedule: {} },
  ]);
  const [activeTab, setActiveTab] = useState('schedule');

  function addWorker() {
    const idx = workers.length;
    setWorkers(prev => [...prev, {
      id: Date.now(), name: `직원${idx + 1}`,
      hourlyWage: MIN_WAGE, color: COLORS[idx % COLORS.length], schedule: {},
    }]);
  }

  function removeWorker(id) {
    setWorkers(prev => prev.filter(w => w.id !== id));
  }

  function updateWorker(id, field, value) {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  // 스케줄 토글: 특정 직원의 특정 요일 on/off
  function toggleDay(workerId, day) {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const schedule = { ...w.schedule };
      if (schedule[day]) {
        delete schedule[day];
      } else {
        // 기본 시간 설정
        schedule[day] = { start: '09:00', end: '18:00' };
      }
      return { ...w, schedule };
    }));
  }

  function updateTime(workerId, day, field, value) {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      return { ...w, schedule: { ...w.schedule, [day]: { ...w.schedule[day], [field]: value } } };
    }));
  }

  // 주간 인건비 계산
  function calcWeeklyWage(worker) {
    return Object.values(worker.schedule).reduce((sum, shift) => {
      const [sh, sm] = shift.start.split(':').map(Number);
      const [eh, em] = shift.end.split(':').map(Number);
      const hours = (eh * 60 + em - sh * 60 - sm) / 60;
      return sum + Math.max(0, hours) * (parseFloat(worker.hourlyWage) || MIN_WAGE);
    }, 0);
  }

  const totalWeekly = workers.reduce((s, w) => s + calcWeeklyWage(w), 0);
  const totalMonthly = totalWeekly * 4;

  const inputStyle = {
    padding: '8px 10px', fontSize: '13px',
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
        <span className="top-bar-title">알바 스케줄러</span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 40px' }}>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-gray-200)', background: '#fff' }}>
          {[{ key: 'schedule', label: '📅 스케줄' }, { key: 'cost', label: '💰 인건비' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: '14px', border: 'none', background: 'none',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-gray-500)',
                borderBottom: activeTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>

          {/* ── 스케줄 탭 ── */}
          {activeTab === 'schedule' && (
            <>
              {/* 주간 요약 그리드 */}
              <div style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
                marginBottom: '16px', overflowX: 'auto',
              }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>주간 스케줄 현황</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '340px' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '12px', color: '#aaa', fontWeight: 600, textAlign: 'left', paddingBottom: '8px', width: '70px' }}>이름</th>
                      {DAYS.map(d => (
                        <th key={d} style={{
                          fontSize: '12px', fontWeight: 700, textAlign: 'center', paddingBottom: '8px',
                          color: d === '토' ? '#4f80e1' : d === '일' ? '#e74c3c' : 'var(--color-gray-700)',
                        }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(w => (
                      <tr key={w.id}>
                        <td style={{ fontSize: '13px', fontWeight: 600, paddingBottom: '6px', color: w.color }}>
                          {w.name}
                        </td>
                        {DAYS.map(d => (
                          <td key={d} style={{ textAlign: 'center', paddingBottom: '6px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '6px', margin: '0 auto',
                              background: w.schedule[d] ? w.color : 'var(--color-gray-100)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', color: w.schedule[d] ? '#fff' : '#ccc', fontWeight: 700,
                            }}>
                              {w.schedule[d] ? '✓' : ''}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 직원별 시간 입력 */}
              {workers.map(w => (
                <div key={w.id} style={{
                  background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
                  boxShadow: 'var(--shadow-sm)', border: `1px solid ${w.color}30`,
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: w.color }}/>
                      <input value={w.name} onChange={e => updateWorker(w.id, 'name', e.target.value)}
                        style={{ ...inputStyle, fontWeight: 700, width: '80px', color: w.color }}/>
                    </div>
                    {workers.length > 1 && (
                      <button onClick={() => removeWorker(w.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                        삭제
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {DAYS.map(d => (
                      <button key={d} onClick={() => toggleDay(w.id, d)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                          cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                          background: w.schedule[d] ? w.color : 'var(--color-gray-100)',
                          color: w.schedule[d] ? '#fff' : 'var(--color-gray-500)',
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* 선택된 요일 시간 설정 */}
                  {Object.entries(w.schedule).sort((a, b) => DAYS.indexOf(a[0]) - DAYS.indexOf(b[0])).map(([day, shift]) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ width: '20px', fontSize: '13px', fontWeight: 700, color: w.color, flexShrink: 0 }}>{day}</span>
                      <input type="time" value={shift.start} onChange={e => updateTime(w.id, day, 'start', e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}/>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>~</span>
                      <input type="time" value={shift.end} onChange={e => updateTime(w.id, day, 'end', e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}/>
                    </div>
                  ))}
                </div>
              ))}

              <button onClick={addWorker}
                style={{
                  width: '100%', padding: '12px', background: 'var(--color-primary-bg)',
                  color: 'var(--color-primary)', border: '1.5px dashed var(--color-accent)',
                  borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                + 직원 추가
              </button>
            </>
          )}

          {/* ── 인건비 탭 ── */}
          {activeTab === 'cost' && (
            <>
              <div style={{
                background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
                padding: '20px', marginBottom: '16px', color: '#fff',
              }}>
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>이번 주 예상 인건비</div>
                <div style={{ fontSize: '28px', fontWeight: 800 }}>{Math.round(totalWeekly).toLocaleString()}원</div>
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>월 환산 약 {Math.round(totalMonthly).toLocaleString()}원 (×4주)</div>
              </div>

              {workers.map(w => {
                const weekly = calcWeeklyWage(w);
                const totalHours = Object.values(w.schedule).reduce((sum, shift) => {
                  const [sh, sm] = shift.start.split(':').map(Number);
                  const [eh, em] = shift.end.split(':').map(Number);
                  return sum + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
                }, 0);
                return (
                  <div key={w.id} style={{
                    background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: w.color }}/>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>{w.name}</span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: w.color }}>
                        {Math.round(weekly).toLocaleString()}원/주
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#aaa' }}>시급</span>
                      <input type="number" value={w.hourlyWage}
                        onChange={e => updateWorker(w.id, 'hourlyWage', e.target.value)}
                        style={{ ...inputStyle, width: '90px' }} inputMode="numeric"/>
                      <span style={{ fontSize: '13px', color: '#aaa' }}>원 | 주 {totalHours.toFixed(1)}시간</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
