'use client';
import { useState, useMemo, useEffect, useRef } from 'react';

const MIN_WAGE = 10030; // 2025년 기준 (2026년: 10,320원 — 연초 업데이트 필요)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKS_PER_MONTH = 52 / 12; // 4.333...주

// 4대보험 요율 (근로자 부담)
const EMPLOYEE_RATES = [
  { label: '국민연금', rate: 0.045 },
  { label: '건강보험', rate: 0.03545 },
  { label: '고용보험', rate: 0.009 },
];
// 사업주 추가 부담 (국민연금 4.5% + 건강보험 3.545% + 고용보험 1.15% + 산재 0.7%)
const EMPLOYER_EXTRA_RATE = 0.045 + 0.03545 + 0.0115 + 0.007;
const EMPLOYEE_TOTAL_RATE = 0.045 + 0.03545 + 0.009;

// 카운트업 애니메이션 훅
function useCountUp(target) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;
    const steps = 18;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      // easeOut 커브 적용
      const t = i / steps;
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (i >= steps) { clearInterval(timer); setDisplay(to); prev.current = to; }
    }, 300 / steps);
    return () => clearInterval(timer);
  }, [target]);
  return display;
}

function AnimatedNum({ value }) {
  const displayed = useCountUp(value);
  return <>{displayed.toLocaleString()}</>;
}

// 토글 스위치
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: on ? 'var(--color-primary)' : 'var(--color-gray-300)',
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

// 스텝 번호 뱃지
function StepBadge({ n, light = false }) {
  return (
    <div style={{
      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
      background: light ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
      color: '#fff', fontSize: '13px', fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{n}</div>
  );
}

// AI 인건비 절감 제안 섹션
function LaborAiSection({ calc, hourlyWage, hoursPerDay, selectedDays, employmentType, insuranceOn, numWorkers }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  async function handleAnalyze() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/tools/labor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourlyWage,
          hoursPerDay,
          daysPerWeek: selectedDays.length,
          employmentType,
          insuranceOn,
          bossTotal: calc.bossTotal,
          netWage: calc.netWage,
          numWorkers,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || 'AI 분석 실패');
    } catch {
      setError('네트워크 오류가 발생했습니다');
    }
    setLoading(false);
  }

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(27,71,151,0.08)', marginTop: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>💡 AI 인건비 절감 제안</div>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>합법적인 인건비 효율화 방법을 알려드려요</div>

      <button
        onClick={handleAnalyze} disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
          background: loading ? '#ccc' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {loading ? 'AI 분석 중...' : '💡 AI 절감 제안 받기'}
      </button>

      {error && <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff0f0', color: '#e74c3c', borderRadius: '10px', fontSize: '13px' }}>⚠️ {error}</div>}

      {result && (
        <div style={{ marginTop: '12px', background: '#1a1a2e', borderRadius: '14px', padding: '18px', animation: 'fadeSlideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f093fb' }}>💡 AI 제안</span>
            {result.cached && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(240,147,251,0.15)', color: '#f093fb', marginLeft: 'auto' }}>캐시됨</span>}
          </div>
          <p style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{result.text}</p>
          <p style={{ fontSize: '11px', color: '#556', marginTop: '8px', marginBottom: 0 }}>* AI 제안은 참고용이며, 실제 적용 전 전문가 상담을 권장합니다.</p>
        </div>
      )}
    </div>
  );
}

export default function LaborCostCalculator() {
  const [hourlyWage, setHourlyWage] = useState(MIN_WAGE.toLocaleString());
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [selectedDays, setSelectedDays] = useState(['월', '화', '수', '목', '금']);
  const [employmentType, setEmploymentType] = useState('regular');
  const [insuranceOn, setInsuranceOn] = useState(true);
  const [wageWarn, setWageWarn] = useState(false);
  const [wageShake, setWageShake] = useState(false);
  const [resultTab, setResultTab] = useState('worker'); // 'worker' | 'boss'
  const [numWorkers, setNumWorkers] = useState(1); // n명 시뮬레이션

  const wage = parseFloat(String(hourlyWage).replace(/,/g, '')) || 0;
  const weeklyHours = hoursPerDay * selectedDays.length;
  const hasWeeklyAllowance = weeklyHours >= 15;

  // 주휴시간: 주 소정근로시간 / 40 × 8 (최대 8시간)
  const weeklyAllowanceHours = hasWeeklyAllowance
    ? Math.min(8, (weeklyHours / 40) * 8) : 0;

  const calc = useMemo(() => {
    if (!wage || selectedDays.length === 0) return null;

    const monthlyBase = Math.round(wage * hoursPerDay * selectedDays.length * WEEKS_PER_MONTH);

    // 단기·일용직은 주휴수당 미발생 (고용 형태 반영)
    const monthlyWeeklyAllowance = (employmentType === 'regular' && hasWeeklyAllowance)
      ? Math.round(wage * weeklyAllowanceHours * WEEKS_PER_MONTH)
      : 0;

    const grossWage = monthlyBase + monthlyWeeklyAllowance;

    // 단기·일용직 + 보험OFF 시 공제 없음
    const applyInsurance = insuranceOn && employmentType === 'regular';
    const employeeDeduction    = applyInsurance ? Math.round(grossWage * EMPLOYEE_TOTAL_RATE)  : 0;
    const employerContribution = applyInsurance ? Math.round(grossWage * EMPLOYER_EXTRA_RATE) : 0;
    const netWage   = grossWage - employeeDeduction;
    const bossTotal = grossWage + employerContribution;

    return { monthlyBase, monthlyWeeklyAllowance, grossWage, employeeDeduction, employerContribution, netWage, bossTotal };
  }, [wage, hoursPerDay, selectedDays, insuranceOn, weeklyAllowanceHours, employmentType, hasWeeklyAllowance]);

  function handleWageChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setHourlyWage(raw ? Number(raw).toLocaleString() : '');
    const num = Number(raw);
    const isWarn = raw && num < MIN_WAGE;
    setWageWarn(isWarn);
    if (isWarn) { setWageShake(true); setTimeout(() => setWageShake(false), 400); }
  }

  function setMinWage() {
    setHourlyWage(MIN_WAGE.toLocaleString());
    setWageWarn(false);
  }

  function toggleDay(day) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  const cardStyle = {
    background: '#fff', borderRadius: '20px', padding: '22px 20px',
    boxShadow: '0 4px 20px rgba(27,71,151,0.08)', marginBottom: '14px',
  };

  const dividerRow = <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 0' }} />;

  // 스텝 완료 여부 — 입력 충분하면 ✅ 표시
  const step1Done = wage > 0 && selectedDays.length > 0;
  const step2Done = true; // 고용조건은 기본값 있음

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 40px', background: 'var(--color-bg)' }}>

      {/* ── Step 1: 기본 정보 ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StepBadge n={1} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gray-900)' }}>기본 정보</span>
          </div>
          {step1Done && <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>✅ 입력 완료</span>}
        </div>

        {/* 시급 입력 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '8px' }}>시급</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            border: `2px solid ${wageWarn ? 'var(--color-warning)' : wageShake ? 'var(--color-warning)' : 'var(--color-gray-300)'}`,
            borderRadius: '12px', padding: '11px 14px', background: '#fff',
            transition: 'border-color 0.2s',
            animation: wageShake ? 'shake 0.35s ease' : 'none',
          }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>₩</span>
            <input
              type="text" inputMode="numeric" value={hourlyWage}
              onChange={handleWageChange}
              style={{
                flex: 1, border: 'none', outline: 'none', textAlign: 'right',
                fontSize: '17px', fontWeight: 700, color: 'var(--color-gray-900)',
                fontFamily: 'inherit', background: 'transparent',
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--color-gray-500)', fontWeight: 600, flexShrink: 0 }}>원</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px' }}>
            <button onClick={setMinWage} style={{
              fontSize: '12px', color: 'var(--color-primary)', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700,
              textDecoration: 'underline', fontFamily: 'inherit',
            }}>
              최저시급 {MIN_WAGE.toLocaleString()}원 클릭 입력
            </button>
            {wageWarn && (
              <span style={{
                fontSize: '12px', color: 'var(--color-warning)', fontWeight: 700,
                animation: 'shake 0.35s ease',
              }}>
                ⚠️ 최저시급 미만이에요
              </span>
            )}
          </div>
        </div>

        {/* 하루 근무시간 — 슬라이더 + 숫자 입력 연동 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>하루 근무시간</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number" min="1" max="12" value={hoursPerDay}
                onChange={e => {
                  // parseInt → parseFloat 으로 변경해 슬라이더 소수점 값과 일치
                  const v = Math.min(12, Math.max(1, parseFloat(e.target.value) || 1));
                  setHoursPerDay(v);
                }}
                style={{
                  width: '54px', padding: '7px 8px', textAlign: 'center',
                  fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)',
                  border: '2px solid var(--color-primary-bg)', borderRadius: '8px',
                  outline: 'none', fontFamily: 'inherit', background: 'var(--color-primary-bg)',
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-gray-500)', fontWeight: 600 }}>시간</span>
            </div>
          </div>
          <input
            type="range" min="1" max="12" step="0.5" value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1b4797', cursor: 'pointer', height: '4px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '4px' }}>
            <span>1시간</span><span>6시간</span><span>12시간</span>
          </div>
        </div>

        {/* 주 근무일수 — 요일 버튼 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>주 근무일수</span>
            <span style={{
              fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)',
              background: 'var(--color-primary-bg)', padding: '3px 10px', borderRadius: '10px',
            }}>
              {selectedDays.length}일 선택됨
            </span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {DAY_LABELS.map(day => {
              const sel = selectedDays.includes(day);
              const isWeekend = day === '토' || day === '일';
              return (
                <button key={day} onClick={() => toggleDay(day)} style={{
                  flex: 1, padding: '9px 0', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  background: sel ? 'var(--color-primary)' : isWeekend ? '#fff5f5' : 'var(--color-gray-100)',
                  color: sel ? '#fff' : isWeekend ? 'var(--color-danger)' : 'var(--color-gray-700)',
                  fontSize: '13px', fontWeight: sel ? 700 : 500,
                  transition: 'all 0.15s', boxShadow: sel ? '0 2px 8px rgba(27,71,151,0.25)' : 'none',
                }}>
                  {day}
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: '10px', fontSize: '12px', textAlign: 'center',
            color: hasWeeklyAllowance ? 'var(--color-primary)' : 'var(--color-gray-500)',
            background: hasWeeklyAllowance ? 'var(--color-primary-bg)' : 'var(--color-gray-100)',
            borderRadius: '8px', padding: '6px',
          }}>
            주 {weeklyHours}시간 근무
            {hasWeeklyAllowance
              ? ' · ✅ 주 15시간 이상 — 주휴수당 발생'
              : ' · ⚠️ 주 15시간 미만 — 주휴수당 없음'}
          </div>
        </div>
      </div>

      {/* ── Step 2: 고용 조건 ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StepBadge n={2} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gray-900)' }}>고용 조건</span>
          </div>
          {step2Done && <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>✅ 입력 완료</span>}
        </div>

        {/* 고용형태 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '10px' }}>고용형태</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'temp',    icon: '🗓️', title: '단기·일용직', desc: '계약기간 1개월 미만' },
              { id: 'regular', icon: '📋', title: '정규 알바',   desc: '월 단위 계약 근로자' },
            ].map(type => {
              const sel = employmentType === type.id;
              return (
                <button key={type.id} onClick={() => setEmploymentType(type.id)} style={{
                  padding: '16px 14px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                  border: sel ? '2px solid var(--color-primary)' : '1.5px solid var(--color-gray-200)',
                  background: sel ? 'var(--color-primary-bg)' : 'var(--color-gray-100)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: sel ? 'var(--color-primary)' : 'var(--color-gray-900)', marginBottom: '4px' }}>
                    {type.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>{type.desc}</div>
                  {sel && (
                    <div style={{
                      marginTop: '8px', fontSize: '11px', fontWeight: 700,
                      color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }}/>
                      선택됨
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4대보험 토글 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>4대보험 적용</span>
            <Toggle on={insuranceOn} onChange={setInsuranceOn} />
          </div>
          {insuranceOn && (
            <div style={{
              background: 'var(--color-gray-100)', borderRadius: '10px',
              padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: '10px 16px',
            }}>
              {EMPLOYEE_RATES.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, display: 'inline-block' }}/>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{(item.rate * 100).toFixed(3).replace(/\.?0+$/, '')}%</span>
                </div>
              ))}
              <div style={{ width: '100%', fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                * 사업주는 위 항목 + 고용보험 1.15%, 산재보험 0.7% 추가 부담
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 3: 결과 카드 ── */}
      {calc ? (
        <div style={{
          background: 'linear-gradient(135deg, #1b4797 0%, #2d5fc4 100%)',
          borderRadius: '20px', padding: '24px 20px', color: '#fff',
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StepBadge n={3} light />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>계산 결과</span>
            </div>
            {/* 주휴수당 뱃지 */}
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              background: (employmentType === 'regular' && hasWeeklyAllowance) ? 'rgba(46,204,113,0.25)' : 'rgba(173,181,189,0.3)',
            }}>
              {(employmentType === 'regular' && hasWeeklyAllowance) ? '✅ 주휴수당 발생' : '❌ 주휴수당 미발생'}
            </span>
          </div>

          {/* 근로자 / 사장 시점 탭 */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '3px', marginBottom: '18px' }}>
            {[
              { id: 'worker', label: '👤 근로자 시점' },
              { id: 'boss',   label: '🏪 사장 시점' },
            ].map(t => (
              <button key={t.id} onClick={() => setResultTab(t.id)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                background: resultTab === t.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff', transition: 'background 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* 금액 표 — 탭에 따라 표시 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '20px' }}>
            {resultTab === 'worker' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ opacity: 0.85 }}>기본급 (월)</span>
                  <span style={{ fontWeight: 600 }}>{calc.monthlyBase.toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ opacity: 0.85 }}>주휴수당 (월)</span>
                  <span style={{ fontWeight: 600 }}>{calc.monthlyWeeklyAllowance.toLocaleString()}원</span>
                </div>
                {dividerRow}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ fontWeight: 700 }}>세전 합계</span>
                  <span style={{ fontWeight: 800 }}>{calc.grossWage.toLocaleString()}원</span>
                </div>
                {insuranceOn && employmentType === 'regular' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.8 }}>
                    <span>4대보험 공제 (근로자 부담)</span>
                    <span style={{ fontWeight: 600 }}>-{calc.employeeDeduction.toLocaleString()}원</span>
                  </div>
                )}
                {dividerRow}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <span style={{ fontWeight: 800 }}>💰 실수령액</span>
                  <span style={{ fontWeight: 800 }}><AnimatedNum value={calc.netWage} />원</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ opacity: 0.85 }}>세전 급여 지급</span>
                  <span style={{ fontWeight: 600 }}>{calc.grossWage.toLocaleString()}원</span>
                </div>
                {insuranceOn && employmentType === 'regular' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.8 }}>
                    <span>4대보험 추가 부담 (사장)</span>
                    <span style={{ fontWeight: 600 }}>+{calc.employerContribution.toLocaleString()}원</span>
                  </div>
                )}
                {dividerRow}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <span style={{ fontWeight: 800 }}>🏪 총 인건비 지출</span>
                  <span style={{ fontWeight: 800 }}><AnimatedNum value={calc.bossTotal} />원</span>
                </div>
              </>
            )}
          </div>

          {/* BIG 숫자 */}
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px' }}>
              {resultTab === 'worker' ? '근로자 월 실수령액' : '사장님 월 총 인건비'}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2 }}>
              ₩ <AnimatedNum value={resultTab === 'worker' ? calc.netWage : calc.bossTotal} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '6px' }}>
              {selectedDays.length}일 × {hoursPerDay}시간 · {wage.toLocaleString()}원/시
              {insuranceOn && employmentType === 'regular' ? ' · 4대보험 포함' : ''}
              {employmentType === 'temp' ? ' · 단기·일용직' : ''}
            </div>
          </div>

          {/* n명 시뮬레이션 슬라이더 */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.9 }}>👥 직원 수별 총 인건비</span>
              <span style={{ fontSize: '18px', fontWeight: 800 }}>{numWorkers}명</span>
            </div>
            <input
              type="range" min="1" max="10" step="1" value={numWorkers}
              onChange={e => setNumWorkers(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#fff', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginBottom: '12px' }}>
              <span>1명</span><span>5명</span><span>10명</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 }}>
              <span>사장 총 월 인건비</span>
              <span>₩ {(calc.bossTotal * numWorkers).toLocaleString()}</span>
            </div>
            {numWorkers > 1 && (
              <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.7, textAlign: 'right' }}>
                1인 기준 {calc.bossTotal.toLocaleString()}원 × {numWorkers}명
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '24px',
          boxShadow: '0 4px 20px rgba(27,71,151,0.08)',
          textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '14px',
        }}>
          <StepBadge n={3} />
          <div style={{ marginTop: '10px' }}>위 정보를 입력하면 인건비가 계산됩니다</div>
        </div>
      )}

      {/* ── AI 절감 제안 ── */}
      {calc && <LaborAiSection calc={calc} hourlyWage={wage} hoursPerDay={hoursPerDay} selectedDays={selectedDays} employmentType={employmentType} insuranceOn={insuranceOn} numWorkers={numWorkers} />}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          80%       { transform: translateX(-3px); }
        }
        input[type='range'] { accent-color: #1b4797; }
      `}</style>
    </div>
  );
}
