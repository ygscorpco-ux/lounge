'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentMinWage, getCurrentInsuranceRates } from '../../lib/constants';

// 현재 연도 기준으로 자동 선택
const MIN_WAGE = getCurrentMinWage();
const IR = getCurrentInsuranceRates();

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKS_PER_MONTH = 52 / 12;

// 컴포넌트에서 쓸 형태로 변환 (lib/constants의 값 참조)
const EMPLOYEE_RATES = [
  { label: '국민연금', rate: IR.nationalPensionEmployee },
  { label: '건강보험', rate: IR.healthEmployee },
  { label: '고용보험', rate: IR.employmentEmployee },
];
const EMPLOYER_EXTRA_RATE = IR.nationalPensionEmployer + IR.healthEmployer + IR.employmentEmployer + IR.industrialAccident;
const EMPLOYEE_TOTAL_RATE = IR.nationalPensionEmployee + IR.healthEmployee + IR.employmentEmployee;

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
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      style={{
        width: '50px',
        height: '30px',
        borderRadius: '999px',
        border: '1px solid rgba(27,71,151,0.12)',
        background: on ? '#1b4797' : '#d9e0ea',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        padding: 0,
        boxShadow: on ? '0 6px 14px rgba(27,71,151,0.18)' : 'none',
        transition: 'background 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '23px' : '3px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(15,23,42,0.18)',
          transition: 'left 0.18s ease',
        }}
      />
    </button>
  );
}

// 스텝 번호 뱃지
function StepBadge({ n }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '58px',
        height: '28px',
        padding: '0 10px',
        borderRadius: '999px',
        background: 'rgba(27,71,151,0.08)',
        color: '#1b4797',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.04em',
      }}
    >
      STEP {n}
    </span>
  );
}

function ResultRow({ label, value, color = 'var(--color-gray-900)', strong = false }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #edf2f8',
      }}
    >
      <span style={{ fontSize: '13px', color: '#5f6c80' }}>{label}</span>
      <span style={{ fontSize: strong ? '15px' : '14px', fontWeight: strong ? 800 : 700, color }}>
        {value}
      </span>
    </div>
  );
}

// AI 인건비 절감 제안 섹션
function LaborAiSection({ calc, hourlyWage, hoursPerDay, selectedDays, employmentType, insuranceOn, numWorkers }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      else setError(data.error || 'AI 분석에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '18px',
        border: '1px solid #e6edf5',
        boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
        marginTop: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>AI 절감 제안</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            현재 입력값 기준으로 줄일 수 있는 비용 포인트를 정리합니다.
          </div>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: '11px 14px',
            borderRadius: '14px',
            border: 'none',
            background: '#1b4797',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: loading ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          {loading ? '분석 중' : '분석하기'}
        </button>
      </div>

      {error ? (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#fff3f1',
            color: '#d94841',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div
          style={{
            marginTop: '14px',
            padding: '16px',
            borderRadius: '18px',
            background: '#f8fbff',
            border: '1px solid #dbe7f7',
            color: '#334155',
            fontSize: '13px',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1b4797' }}>추천 요약</span>
            {result.cached ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(27,71,151,0.08)',
                  color: '#1b4797',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                저장 결과
              </span>
            ) : null}
          </div>
          {result.text}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e6edf5',
              color: '#7b8798',
              fontSize: '11px',
            }}
          >
            실제 적용 전에는 노무사 또는 고용노동부 상담으로 조건을 다시 확인하세요.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSigned(amount) {
  return `${amount < 0 ? '-' : ''}${Math.abs(amount).toLocaleString()}원`;
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(3).replace(/\.?0+$/, '')}%`;
}

export default function LaborCostCalculator() {
  const [hourlyWage, setHourlyWage] = useState(MIN_WAGE.toLocaleString());
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [selectedDays, setSelectedDays] = useState(['월', '화', '수', '목', '금']);
  const [employmentType, setEmploymentType] = useState('regular');
  const [insuranceOn, setInsuranceOn] = useState(true);
  const [tax33On, setTax33On] = useState(false); // 단기·일용직 3.3% 원천징수
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

    // 3.3% 원천징수 — 사업소득세(3%) + 지방소득세(0.3%)
    // 고용형태 무관하게 알바 요청 시 또는 프리랜서 계약 시 적용
    // 사장이 대신 납부하므로 bossTotal에는 영향 없고 근로자 실수령액만 감소
    const tax33Deduction = tax33On ? Math.round(grossWage * 0.033) : 0;

    const netWage   = grossWage - employeeDeduction - tax33Deduction;
    const bossTotal = grossWage + employerContribution;

    return { monthlyBase, monthlyWeeklyAllowance, grossWage, employeeDeduction, employerContribution, tax33Deduction, netWage, bossTotal };
  }, [wage, hoursPerDay, selectedDays, insuranceOn, tax33On, weeklyAllowanceHours, employmentType, hasWeeklyAllowance]);

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
    background: '#fff',
    borderRadius: '24px',
    padding: '20px',
    border: '1px solid #e6edf5',
    boxShadow: '0 12px 28px rgba(15,23,42,0.04)',
    marginBottom: '14px',
  };

  // 스텝 완료 여부 — 입력 충분하면 ✅ 표시
  const step1Done = wage > 0 && selectedDays.length > 0;
  const step2Done = true; // 고용조건은 기본값 있음
  const resultAmount = calc ? (resultTab === 'worker' ? calc.netWage : calc.bossTotal) : 0;
  const selectedDaysLabel = DAY_LABELS.filter((day) => selectedDays.includes(day)).join(' · ');
  const quickStats = calc
    ? resultTab === 'worker'
      ? [
          { label: '기본급', value: `${calc.monthlyBase.toLocaleString()}원` },
          { label: '주휴수당', value: `${calc.monthlyWeeklyAllowance.toLocaleString()}원` },
          { label: '총 차감', value: `${(calc.employeeDeduction + calc.tax33Deduction).toLocaleString()}원` },
        ]
      : [
          { label: '월 급여', value: `${calc.grossWage.toLocaleString()}원` },
          { label: '사업주 부담', value: `${calc.employerContribution.toLocaleString()}원` },
          { label: '직원 수', value: `${numWorkers}명` },
        ]
    : [];

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '14px 14px 34px', background: 'var(--color-bg)' }}>

      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '18px',
        border: '1px solid #e6edf5',
        boxShadow: '0 12px 28px rgba(15,23,42,0.04)',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>빠른 계산</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              시급과 근무시간을 넣으면 월 인건비를 바로 봅니다.
            </div>
          </div>
          <div style={{
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(27,71,151,0.08)',
            color: '#1b4797',
            fontSize: '11px',
            fontWeight: 800,
            flexShrink: 0,
          }}>
            2026 기준
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {[
            `주 ${selectedDays.length}일`,
            `하루 ${hoursPerDay}시간`,
            hasWeeklyAllowance ? '주휴수당 포함' : '주휴수당 미포함',
          ].map((item) => (
            <span
              key={item}
              style={{
                padding: '7px 11px',
                borderRadius: '999px',
                background: item === '주휴수당 포함' ? 'rgba(27,71,151,0.08)' : '#f4f7fb',
                color: item === '주휴수당 포함' ? '#1b4797' : '#334155',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

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
                type="number" min="1" max="12" step="0.5" value={hoursPerDay}
                onChange={e => {
                  const raw = parseFloat(e.target.value);
                  if (isNaN(raw)) return;
                  // 0.5 단위로 반올림해 슬라이더와 동기화
                  const snapped = Math.round(raw * 2) / 2;
                  const v = Math.min(12, Math.max(1, snapped));
                  setHoursPerDay(v);
                }}
                style={{
                  width: '72px', minWidth: '72px', padding: '7px 8px', textAlign: 'center',
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
        <div style={{ marginBottom: '14px' }}>
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
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatPercent(item.rate)}</span>
                </div>
              ))}
              <div style={{ width: '100%', fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                * 사업주는 위 항목 + 고용보험 1.15%, 산재보험 0.7% 추가 부담
              </div>
            </div>
          )}
        </div>

        {/* 3.3% 원천징수 — 고용형태 관계없이 알바 요청 시 적용 가능 */}
        <div style={{ borderTop: '1px solid var(--color-gray-200)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-700)' }}>3.3% 원천징수</span>
                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginLeft: '6px' }}>사업소득세 3% + 지방소득세 0.3%</span>
              </div>
              <Toggle on={tax33On} onChange={setTax33On} />
            </div>
            {tax33On && (
              <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', background: 'var(--color-gray-100)', borderRadius: '8px', padding: '8px 12px', lineHeight: 1.6 }}>
                알바가 요청하거나 프리랜서 계약 시 적용해요. 사장님이 세금을 대신 납부하고 근로자 실수령액에서 차감해요.
              </div>
            )}
        </div>
      </div>

      {/* ── Step 3: 결과 카드 ── */}
      {calc ? (
        <div style={{
          background: '#fff',
          borderRadius: '26px',
          padding: '20px',
          border: '1px solid #dbe7f5',
          boxShadow: '0 14px 32px rgba(15,23,42,0.05)',
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <StepBadge n={3} />
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>예상 결과</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                근로자 관점과 사장님 관점을 바로 바꿔 볼 수 있습니다.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f3f6fb', borderRadius: '16px', padding: '4px', marginBottom: '16px' }}>
            {[
              { id: 'worker', label: '근로자 기준' },
              { id: 'boss', label: '사장님 기준' },
            ].map((t) => (
              <button key={t.id} onClick={() => setResultTab(t.id)} style={{
                flex: 1,
                height: '42px',
                borderRadius: '12px',
                border: 'none',
                background: resultTab === t.id ? '#1b4797' : 'transparent',
                color: resultTab === t.id ? '#fff' : '#475569',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{
            padding: '20px',
            borderRadius: '22px',
            background: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)',
            border: '1px solid #d7e4f4',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#5f6c80' }}>
              {resultTab === 'worker' ? '월 실수령 예상' : '월 총 인건비 예상'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '34px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.04em' }}>
              <AnimatedNum value={resultAmount} />
              <span style={{ fontSize: '20px', marginLeft: '2px' }}>원</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#1b4797', fontWeight: 700 }}>
              {selectedDaysLabel || '요일 미선택'} · 하루 {hoursPerDay}시간 · 시급 {wage.toLocaleString()}원
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {quickStats.map((item) => (
              <div key={item.label} style={{
                padding: '14px 10px',
                borderRadius: '18px',
                background: '#f8fafc',
                border: '1px solid #e6edf5',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 2px', marginBottom: '14px' }}>
            {resultTab === 'worker' ? (
              <>
                <ResultRow label="기본급" value={`${calc.monthlyBase.toLocaleString()}원`} />
                <ResultRow label="주휴수당" value={`${calc.monthlyWeeklyAllowance.toLocaleString()}원`} />
                <ResultRow label="보험 공제" value={formatSigned(-calc.employeeDeduction)} color="#d94841" />
                <ResultRow label="3.3% 공제" value={formatSigned(-calc.tax33Deduction)} color="#d94841" />
                <ResultRow label="실수령액" value={`${calc.netWage.toLocaleString()}원`} color="#1b4797" strong />
              </>
            ) : (
              <>
                <ResultRow label="급여 지급액" value={`${calc.grossWage.toLocaleString()}원`} />
                <ResultRow label="보험 추가 부담" value={formatSigned(calc.employerContribution)} color="#1b4797" />
                <ResultRow label={`${numWorkers}명 기준 총 인건비`} value={`${(calc.bossTotal * numWorkers).toLocaleString()}원`} color="#1b4797" strong />
              </>
            )}
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '20px',
            background: '#f8fafc',
            border: '1px solid #e6edf5',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>직원 수 시뮬레이션</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  여러 명을 채용할 때 총 부담액을 바로 봅니다.
                </div>
              </div>
              <div style={{
                minWidth: '48px',
                height: '34px',
                borderRadius: '999px',
                background: 'rgba(27,71,151,0.08)',
                color: '#1b4797',
                fontSize: '14px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {numWorkers}명
              </div>
            </div>
            <input
              type="range" min="1" max="10" step="1" value={numWorkers}
              onChange={e => setNumWorkers(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1b4797' }}
            />
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#334155', fontWeight: 700 }}>
              월 총 예상 인건비 {(calc.bossTotal * numWorkers).toLocaleString()}원
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid #e6edf5',
          boxShadow: '0 12px 28px rgba(15,23,42,0.04)',
          textAlign: 'center',
          color: 'var(--color-gray-500)',
          fontSize: '14px',
        }}>
          <StepBadge n={3} />
          <div style={{ marginTop: '10px' }}>위 정보를 입력하면 예상 인건비가 계산됩니다.</div>
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
