'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentMinWage } from '../../lib/constants';

const STEPS = ['사업장', '근로자', '근무조건', '미리보기', '완료'];
const DAY_ORDER = ['월', '화', '수', '목', '금', '토', '일'];
const MIN_WAGE  = getCurrentMinWage(); // 연도별 자동 선택

// ── 공통 스타일 헬퍼 ──────────────────────────────────────────────────
const inp = (extra = {}) => ({
  width: '100%', padding: '11px 13px', fontSize: '14px',
  border: '1.5px solid var(--color-gray-300)', borderRadius: '10px',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', ...extra,
});
const label = (extra = {}) => ({
  fontSize: '12px', fontWeight: 700, color: 'var(--color-gray-700)',
  marginBottom: '6px', display: 'block', ...extra,
});
const card = {
  background: '#fff', borderRadius: '16px', padding: '20px',
  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
  marginBottom: '16px',
};

// ── 진행바 ────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: '#fff', borderBottom: '1px solid var(--color-gray-200)' }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700,
            background: i < current ? 'var(--color-success)' : i === current ? 'var(--color-primary)' : 'var(--color-gray-300)',
            color: i <= current ? '#fff' : 'var(--color-gray-500)',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: i === current ? 'var(--color-primary)' : 'var(--color-gray-500)', marginLeft: '4px', display: i === current ? 'block' : 'none' }}>
            {s}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: '2px', margin: '0 6px', background: i < current ? 'var(--color-success)' : 'var(--color-gray-300)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── 성공 체크 애니메이션 SVG ─────────────────────────────────────────
function CheckAnim() {
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#2ecc71" strokeWidth="5" strokeDasharray="290" style={{ animation: 'drawCircle 0.5s ease forwards' }} />
      <polyline points="28,52 43,66 72,36" fill="none" stroke="#2ecc71" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" style={{ animation: 'drawCheck 0.3s 0.5s ease forwards', strokeDashoffset: 60 }} />
      <style>{`
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

// ── 계약서 미리보기 렌더러 ────────────────────────────────────────────
function ContractPreview({ data, type }) {
  const Row = ({ l, v, err }) => (
    <tr>
      <td style={{ padding: '6px 8px', fontSize: '13px', color: '#555', whiteSpace: 'nowrap', verticalAlign: 'top', width: '100px' }}>{l}</td>
      <td style={{ padding: '6px 8px', fontSize: '13px', fontWeight: 600, borderBottom: err ? '2px solid #e74c3c' : '1px solid #eee', color: err ? '#e74c3c' : '#222' }}>
        {v || <span style={{ color: '#e74c3c' }}>미입력</span>}
      </td>
    </tr>
  );

  const missingFields = [];
  if (!data.businessName) missingFields.push('사업장명');
  if (!data.workerName)   missingFields.push('근로자명');
  if (!data.wage)         missingFields.push('시급');
  if (!data.endDate)      missingFields.push('급여지급일');

  return (
    <div id="contract-preview" style={{ background: '#fff', padding: '24px 20px', border: '1px solid #ddd', borderRadius: '8px', lineHeight: 1.8 }}>
      {missingFields.length > 0 && (
        <div style={{ background: '#fff0f0', border: '1.5px solid #e74c3c', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#e74c3c', fontWeight: 600 }}>
          ⚠️ 미입력 항목이 있어요: {missingFields.join(', ')}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1b4797', marginBottom: '4px' }}>
          {type === '표준' ? '표준 근로계약서' : '단기 근로계약서'}
        </div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          (「근로기준법」 제17조에 따라 작성)
        </div>
      </div>

      <p style={{ fontSize: '13px', marginBottom: '14px', color: '#444' }}>
        사업주 <strong>{data.businessName || '______'}</strong>(이하 "사업주"라 함)과
        근로자 <strong>{data.workerName || '______'}</strong>(이하 "근로자"라 함)은
        다음과 같이 근로계약을 체결한다.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <tbody>
          {type === '단기' && <Row l="계약기간" v={data.contractPeriod} err={!data.contractPeriod} />}
          <Row l="근무장소"   v={data.workplace}     />
          <Row l="업무내용"   v={data.taskContent}    />
          <Row l="근무요일"   v={data.workDays?.join('·')} />
          <Row l="근무시간"   v={data.startTime && data.endTime ? `${data.startTime} ~ ${data.endTime} (휴게 ${data.breakTime || 60}분)` : null} />
          <Row l="시급"      v={data.wage ? `${parseInt(data.wage).toLocaleString()}원` : null} err={!data.wage} />
          <Row l="급여지급일" v={data.payday ? `매월 ${data.payday}일` : null}  err={!data.payday} />
          <Row l="지급방법"   v="직접지급 또는 통장입금" />
          <Row l="4대보험"   v={data.insurance ? '적용' : '미적용 (단기·일용 해당 시)'} />
        </tbody>
      </table>

      {data.specialTerms && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px' }}>특약 사항</div>
          <div style={{ fontSize: '13px', color: '#444', whiteSpace: 'pre-wrap' }}>{data.specialTerms}</div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
        위와 같이 근로계약을 체결하고, 각자 1부씩 보관한다.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>사업주</div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{data.ceoName || '______'}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>(인)</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>근로자</div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{data.workerName || '______'}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>(인)</div>
        </div>
      </div>
    </div>
  );
}

// ── AI 특약 검토 컴포넌트 ──────────────────────────────────────────────
function ContractSpecialTermsAI({ specialTerms }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  async function handleAnalyze() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/tools/contract-special-terms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialTerms }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || '검토 실패');
    } catch { setError('네트워크 오류'); }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <button onClick={handleAnalyze} disabled={loading} style={{
        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
        background: loading ? '#ccc' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
      }}>
        {loading ? 'AI 검토 중...' : '🤖 AI 특약 위험 분석'}
      </button>
      {error && <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff0f0', color: '#e74c3c', borderRadius: '8px', fontSize: '12px' }}>⚠️ {error}</div>}
      {result?.riskItems?.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {result.riskItems.map((item, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', background: '#fff0f0', border: '1.5px solid #e74c3c20' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e74c3c', marginBottom: '4px' }}>⚠️ 위험 조항</div>
              <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px', fontStyle: 'italic' }}>"{item.original}"</div>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>사유: {item.risk}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#27ae60' }}>✅ 합법적 대안: {item.alternative}</div>
            </div>
          ))}
        </div>
      )}
      {result?.riskItems?.length === 0 && result && (
        <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f0faf4', color: '#27ae60', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
          ✅ 특약 내용에서 법적 문제가 발견되지 않았습니다
        </div>
      )}
    </div>
  );
}

// ── AI 계약서 전체 법적 검토 컴포넌트 ────────────────────────────────
function ContractReviewAI({ contractData: d, contractPeriod }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  async function handleReview() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/tools/contract-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: d.businessName, ceoName: d.ceoName,
          workerName: d.workerName, employmentType: d.contractType,
          startDate: d.contractStart, endDate: d.contractEnd,
          hourlyWage: parseInt(d.wage), hoursPerDay: null,
          workDays: d.workDays, specialTerms: d.specialTerms,
          taskDescription: d.taskContent,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || '검토 실패');
    } catch { setError('네트워크 오류'); }
    setLoading(false);
  }

  const riskColors = { '낮음': '#27ae60', '보통': '#f39c12', '높음': '#e74c3c' };

  return (
    <div style={{ marginTop: '14px', background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(27,71,151,0.08)', border: '1px solid #eee' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>⚖️ AI 법적 검토</div>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>근로기준법 기준으로 계약서 전체를 검토합니다</div>
      <button onClick={handleReview} disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
        background: loading ? '#ccc' : 'linear-gradient(135deg, #1b4797 0%, #4f80e1 100%)',
        color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
      }}>
        {loading ? '검토 중...' : '⚖️ AI 법적 검토 받기'}
      </button>
      {error && <div style={{ marginTop: '8px', padding: '8px', background: '#fff0f0', color: '#e74c3c', borderRadius: '8px', fontSize: '12px' }}>⚠️ {error}</div>}
      {result && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>리스크 등급</span>
            <span style={{
              padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
              background: riskColors[result.riskLevel] + '20',
              color: riskColors[result.riskLevel],
            }}>
              {result.riskLevel}
            </span>
          </div>
          {result.issues?.map((issue, i) => (
            <div key={i} style={{ padding: '10px', borderRadius: '8px', marginBottom: '8px', background: '#f8f9fa', borderLeft: '3px solid #f39c12' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>{issue.field}</div>
              <div style={{ fontSize: '12px', color: '#555', margin: '3px 0' }}>{issue.issue}</div>
              <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 600 }}>→ {issue.suggestion}</div>
            </div>
          ))}
          {result.overallComment && (
            <div style={{ padding: '10px 12px', background: '#eef2fb', borderRadius: '8px', fontSize: '13px', color: '#1b4797', fontWeight: 600 }}>
              💬 {result.overallComment}
            </div>
          )}
          <p style={{ fontSize: '10px', color: '#6c757d', marginTop: '8px', marginBottom: 0, lineHeight: 1.6 }}>
            ⚠️ AI 검토는 참고용이며 법적 효력이 없어요. 중요한 계약은 노무사 또는 법률 전문가의 검토를 받으시길 권장해요.
          </p>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function ContractGenerator() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const workerId     = searchParams.get('workerId');

  const [step, setStep] = useState(0);
  const [err,  setErr]  = useState('');

  // 폼 데이터 (전 스텝 공유)
  const [d, setD] = useState({
    // Step 1 - 사업장
    businessName: '', ceoName: '', bizAddress: '', bizNumber: '',
    // Step 2 - 근로자
    workerName: '', workerBirth: '', workerAddress: '',
    // Step 3 - 근무조건
    contractType: '표준',                   // 표준 | 단기
    contractStart: '', contractEnd: '',
    workplace: '', taskContent: '',
    workDays: ['월', '화', '수', '목', '금'],
    startTime: '09:00', endTime: '18:00', breakTime: '60',
    wage: '', payday: '25',
    insurance: false, specialTerms: '',
  });

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const contractPeriod = d.contractStart && d.contractEnd ? `${d.contractStart} ~ ${d.contractEnd}` : '';

  // 직원 데이터 자동 불러오기
  useEffect(() => {
    if (!workerId) return;
    fetch(`/api/workers/${workerId}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) return;
        const w = res.data;
        setD(p => ({
          ...p,
          workerName:    w.name || '',
          workerBirth:   w.birth_date || '',
          workDays:      w.work_days ? w.work_days.split(',') : ['월','화','수','목','금'],
          startTime:     w.start_time || '09:00',
          endTime:       w.end_time   || '18:00',
          taskContent:   w.task_description || '',
          wage:          String(w.hourly_wage || ''),
          contractType:  w.employment_type === '정규' ? '표준' : '단기',
          contractStart: w.contract_start || '',
          contractEnd:   w.contract_end   || '',
        }));
      });
  }, [workerId]);

  function toggleDay(day) {
    setD(p => ({
      ...p, workDays: p.workDays.includes(day)
        ? p.workDays.filter(x => x !== day)
        : [...p.workDays, day],
    }));
  }

  // 스텝 유효성 검사
  function validate() {
    if (step === 0 && (!d.businessName || !d.ceoName)) { setErr('사업장명과 대표자명은 필수입니다'); return false; }
    if (step === 1 && !d.workerName)                   { setErr('근로자 이름은 필수입니다'); return false; }
    if (step === 2 && (!d.wage || !d.payday))           { setErr('시급과 급여지급일은 필수입니다'); return false; }
    setErr('');
    return true;
  }

  function next() { if (validate()) setStep(s => s + 1); }
  function prev() { setErr(''); setStep(s => s - 1); }

  async function handleFinish() {
    try {
      const r = await fetch('/api/contract/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...d,
          address: d.bizAddress,
          contractPeriod,
          businessName: d.businessName,
          workerName: d.workerName,
          wage: d.wage,
          endDate: d.payday,
        }),
      });
      const res = await r.json();
      if (res.success) setStep(4);
      else setErr(res.error || '오류가 발생했습니다');
    } catch {
      setErr('네트워크 오류가 발생했습니다. 다시 시도해주세요');
    }
  }

  async function handlePDF() {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF }       = await import('jspdf');
    const el = document.getElementById('contract-preview');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgW = 210, imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
    pdf.save(`근로계약서_${d.workerName}_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // ── 인풋 헬퍼 ──────────────────────────────────────────────────────
  const Field = ({ k, label: l, ...props }) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={label()}>{l}</label>
      <input value={d[k]} onChange={e => set(k, e.target.value)} style={inp()} {...props} />
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', paddingBottom: '30px' }}>
      <StepBar current={step} />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px' }}>

        {err && (
          <div style={{ padding: '11px 14px', background: '#fff0f0', color: '#e74c3c', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
            ⚠️ {err}
          </div>
        )}

        {/* ── STEP 0: 사업장 정보 ── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>사업장 정보</div>
            <div style={card}>
              <Field k="businessName" label="사업장명 *" placeholder="예) 행복한 카페" />
              <Field k="ceoName"      label="대표자명 *" placeholder="홍길동" />
              <Field k="bizAddress"   label="사업장 주소" placeholder="서울시 강남구..." />
              <Field k="bizNumber"    label="사업자등록번호" placeholder="000-00-00000" />
            </div>
          </div>
        )}

        {/* ── STEP 1: 근로자 정보 ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>근로자 정보</div>
            {workerId && (
              <div style={{ padding: '11px 14px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                ✅ 저장된 직원 정보를 불러왔어요
              </div>
            )}
            <div style={card}>
              <Field k="workerName"    label="이름 *"     placeholder="홍길동" />
              <div style={{ marginBottom: '12px' }}>
                <label style={label()}>생년월일</label>
                <input type="date" value={d.workerBirth} onChange={e => set('workerBirth', e.target.value)} style={inp()} />
              </div>
              <Field k="workerAddress" label="주소" placeholder="서울시..." />
            </div>
          </div>
        )}

        {/* ── STEP 2: 근무조건 ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>근무 조건</div>

            {/* 계약서 종류 */}
            <div style={card}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '10px' }}>계약서 종류</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
                {[
                  { id: '표준', sub: '정규 알바' },
                  { id: '단기', sub: '단기·일용직' },
                ].map(t => (
                  <button key={t.id} onClick={() => set('contractType', t.id)} style={{
                    flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    border: d.contractType === t.id ? '2px solid var(--color-primary)' : '2px solid var(--color-gray-200)',
                    background: d.contractType === t.id ? 'var(--color-primary-bg)' : '#fff',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: d.contractType === t.id ? 'var(--color-primary)' : 'var(--color-gray-900)' }}>{t.id}근로계약서</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 단기 계약기간 */}
            {d.contractType === '단기' && (
              <div style={{ ...card, animation: 'fadeIn 0.2s' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '10px' }}>계약기간</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" value={d.contractStart} onChange={e => set('contractStart', e.target.value)} style={{ ...inp(), flex: 1 }} />
                  <span style={{ color: '#aaa' }}>~</span>
                  <input type="date" value={d.contractEnd} onChange={e => set('contractEnd', e.target.value)} style={{ ...inp(), flex: 1 }} />
                </div>
              </div>
            )}

            {/* 근무 정보 */}
            <div style={card}>
              <Field k="workplace"   label="근무장소" placeholder="예) 행복한 카페 1호점" />
              <Field k="taskContent" label="업무내용" placeholder="예) 홀 서빙, 음료 제조" />

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '8px' }}>근무요일</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {DAY_ORDER.map(day => (
                  <button key={day} onClick={() => toggleDay(day)} style={{
                    width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                    background: d.workDays.includes(day) ? 'var(--color-primary)' : 'var(--color-gray-100)',
                    color: d.workDays.includes(day) ? '#fff' : 'var(--color-gray-700)',
                  }}>{day}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={label()}>시작시간</label>
                  <input type="time" value={d.startTime} onChange={e => set('startTime', e.target.value)} style={inp()} />
                </div>
                <span style={{ color: '#aaa', marginTop: '20px' }}>~</span>
                <div style={{ flex: 1 }}>
                  <label style={label()}>종료시간</label>
                  <input type="time" value={d.endTime} onChange={e => set('endTime', e.target.value)} style={inp()} />
                </div>
                <div style={{ width: '70px' }}>
                  <label style={label()}>휴게(분)</label>
                  <input type="number" value={d.breakTime} onChange={e => set('breakTime', e.target.value)} style={inp()} />
                </div>
              </div>
            </div>

            {/* 급여 */}
            <div style={card}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 2 }}>
                  <label style={label()}>시급 *</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={d.wage} onChange={e => set('wage', e.target.value)}
                      placeholder={String(MIN_WAGE)} style={inp({ paddingRight: '32px' })} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#aaa' }}>원</span>
                  </div>
                  {d.wage && parseInt(d.wage) < MIN_WAGE && (
                    <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '3px' }}>⚠️ 최저시급 미만</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label()}>급여지급일 *</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={d.payday} onChange={e => set('payday', e.target.value)}
                      placeholder="25" min="1" max="31" style={inp({ paddingRight: '24px' })} />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#aaa' }}>일</span>
                  </div>
                </div>
              </div>

              {/* 4대보험 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--color-gray-200)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>4대보험 가입</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>근로자 부담 약 9.05%</div>
                </div>
                <div onClick={() => set('insurance', !d.insurance)} style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  background: d.insurance ? 'var(--color-primary)' : 'var(--color-gray-300)',
                }}>
                  <div style={{
                    position: 'absolute', top: '3px', left: d.insurance ? '23px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {/* 특약 */}
              <div style={{ marginTop: '12px' }}>
                <label style={label()}>기타 특약사항</label>
                <textarea value={d.specialTerms} onChange={e => set('specialTerms', e.target.value)}
                  placeholder="예) 수습기간 3개월 시급 90% 적용..." rows={3}
                  style={{ ...inp(), resize: 'vertical' }} />
              </div>

              {/* AI 특약 검토 */}
              {d.specialTerms && d.specialTerms.length > 5 && (
                <ContractSpecialTermsAI specialTerms={d.specialTerms} />
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3 & 4: 미리보기 (Step 4에서도 hidden으로 DOM 유지 → PDF 생성 가능) ── */}
        {step >= 3 && (
          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>계약서 미리보기</div>
            <ContractPreview data={{ ...d, contractPeriod, endDate: d.payday }} type={d.contractType} />
            {/* AI 법적 검토 */}
            <ContractReviewAI contractData={d} contractPeriod={contractPeriod} />
          </div>
        )}

        {/* ── STEP 4: 완료 ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckAnim />
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: '20px', marginBottom: '8px' }}>
              계약서가 완성되었어요 ✅
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-gray-500)', marginBottom: '32px' }}>
              PDF로 저장해서 직원에게 전달하세요
            </div>

            <button onClick={handlePDF} style={{
              width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
              background: 'var(--color-primary)', color: '#fff',
              fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px',
            }}>
              📄 PDF 다운로드
            </button>
            <button onClick={() => router.push('/tools/worker-scheduler')} style={{
              width: '100%', padding: '13px', borderRadius: '14px', border: 'none',
              background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            }}>
              알바관리로 돌아가기
            </button>
          </div>
        )}

        {/* ── 네비게이션 버튼 ── */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {step > 0 && (
              <button onClick={prev} style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                border: '2px solid var(--color-gray-300)', background: '#fff',
                color: 'var(--color-gray-700)', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}>이전</button>
            )}
            {step < 3 ? (
              <button onClick={next} style={{
                flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}>다음 →</button>
            ) : (
              <button onClick={handleFinish} style={{
                flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
                background: 'var(--color-success)', color: '#fff',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}>계약서 완성 ✅</button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
