'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── 상수 ──────────────────────────────────────────────────────────────
const DAY_KR   = ['일', '월', '화', '수', '목', '금', '토'];
const WORK_DAYS_ORDER = ['월', '화', '수', '목', '금', '토', '일'];
const STATUS_INFO = {
  정상출근: { color: '#2ecc71', bg: '#e8f8f0' },
  결근:     { color: '#e74c3c', bg: '#fff0f0' },
  지각:     { color: '#f39c12', bg: '#fff8e1' },
  조퇴:     { color: '#adb5bd', bg: '#f4f6fb' },
};
const EMP_BADGE = {
  정규: { color: '#1b4797', bg: '#eef2fb' },
  단기: { color: '#f39c12', bg: '#fff8e1' },
  일용: { color: '#e74c3c', bg: '#fff0f0' },
};
const MIN_WAGE = 10030;

// ── 유틸 ─────────────────────────────────────────────────────────────
const pad2 = n => String(n).padStart(2, '0');
const todayStr = () => { const t = new Date(); return `${t.getFullYear()}-${pad2(t.getMonth()+1)}-${pad2(t.getDate())}`; };

// 주의 월요일 날짜 계산
function getWeekStart(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=sun
  const diff = dow === 0 ? -6 : 1 - dow; // 월요일로
  d.setDate(d.getDate() + diff);
  return d;
}

// 주간 7일 날짜 배열 (월~일)
function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  });
}

// 근무시간 계산
function calcHours(clockIn, clockOut, breakMin) {
  if (!clockIn || !clockOut) return 0;
  const [ih, im] = clockIn.split(':').map(Number);
  const [oh, om] = clockOut.split(':').map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im) - (breakMin || 60);
  return Math.max(0, mins / 60);
}

// ── 공통 서브컴포넌트 ─────────────────────────────────────────────────

// 토스트 메시지
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(33,37,41,0.88)', color: '#fff', padding: '10px 22px',
      borderRadius: '24px', fontSize: '14px', fontWeight: 600, zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    }}>
      {msg}
    </div>
  );
}

// 바텀시트 래퍼
function Sheet({ open, onClose, title, children, height = '90dvh' }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', background: '#fff',
        borderRadius: '20px 20px 0 0', zIndex: 500,
        maxHeight: height, overflowY: 'auto', animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ width: '40px', height: '4px', background: '#ddd', borderRadius: '2px', margin: '0 auto 14px' }} />
          {title && <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>{title}</div>}
        </div>
        <div style={{ padding: '0 20px 40px' }}>{children}</div>
      </div>
    </>
  );
}

// 스켈레톤
function Skeleton({ h = 72, mb = 10 }) {
  return <div style={{ height: h, borderRadius: '14px', background: '#f0f0f0', marginBottom: mb, animation: 'shimmer 1.2s infinite' }} />;
}

// 직원 아바타
function Avatar({ name, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>
      {name?.slice(0, 1)}
    </div>
  );
}

// ── 직원 폼 (추가/수정 공용) ──────────────────────────────────────────
const EMPTY_FORM = {
  name: '', phone: '', birth_date: '',
  employment_type: '정규', hourly_wage: '',
  work_days: ['월', '화', '수', '목', '금'],
  start_time: '09:00', end_time: '18:00',
  contract_start: '', contract_end: '',
  task_description: '',
};

function WorkerForm({ initial, onSave, onContract }) {
  const [f, setF] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function toggleDay(d) {
    setF(p => ({
      ...p,
      work_days: p.work_days.includes(d) ? p.work_days.filter(x => x !== d) : [...p.work_days, d],
    }));
  }

  async function handleSave(goContract = false) {
    if (!f.name.trim()) { setErr('이름은 필수입니다'); return; }
    setSaving(true);
    setErr('');
    const body = { ...f, hourly_wage: parseInt(f.hourly_wage) || MIN_WAGE };
    const url = initial?.id ? `/api/workers/${initial.id}` : '/api/workers';
    const method = initial?.id ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { goContract ? onContract(d.data?.id || initial?.id) : onSave(); }
      else setErr(d.error);
    } catch { setErr('저장 실패'); }
    setSaving(false);
  }

  const inp = (k, props = {}) => (
    <input
      value={f[k]} onChange={e => set(k, e.target.value)}
      style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      {...props}
    />
  );

  return (
    <div>
      {err && <div style={{ padding: '10px', background: '#fff0f0', color: '#e74c3c', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>{err}</div>}

      {/* 기본 정보 */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1.5px solid var(--color-gray-200)' }}>기본 정보</div>
      <div style={{ marginBottom: '10px' }}>{inp('name', { placeholder: '이름 *' })}</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>{inp('phone', { placeholder: '연락처', type: 'tel' })}</div>
        <div style={{ flex: 1 }}>{inp('birth_date', { type: 'date' })}</div>
      </div>

      {/* 고용 조건 */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '1.5px solid var(--color-gray-200)' }}>고용 조건</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {['정규', '단기', '일용'].map(t => (
          <button key={t} onClick={() => set('employment_type', t)} style={{
            flex: 1, padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            border: f.employment_type === t ? `2px solid var(--color-primary)` : '2px solid var(--color-gray-200)',
            background: f.employment_type === t ? 'var(--color-primary-bg)' : '#fff',
            color: f.employment_type === t ? 'var(--color-primary)' : 'var(--color-gray-700)',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '10px' }}>
        {inp('hourly_wage', { type: 'number', placeholder: `시급 (최저 ${MIN_WAGE.toLocaleString()}원)` })}
        {parseInt(f.hourly_wage) > 0 && parseInt(f.hourly_wage) < MIN_WAGE && (
          <div style={{ fontSize: '12px', color: '#f39c12', marginTop: '4px' }}>⚠️ 최저시급({MIN_WAGE.toLocaleString()}원) 미만이에요</div>
        )}
        <button onClick={() => set('hourly_wage', String(MIN_WAGE))} style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-bg)', border: 'none', borderRadius: '6px', padding: '2px 7px', cursor: 'pointer' }}>최저</button>
      </div>

      {/* 단기·일용 계약기간 */}
      {(f.employment_type === '단기' || f.employment_type === '일용') && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', animation: 'fadeIn 0.2s' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginBottom: '4px' }}>계약시작일</div>
            {inp('contract_start', { type: 'date' })}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginBottom: '4px' }}>계약종료일</div>
            {inp('contract_end', { type: 'date' })}
          </div>
        </div>
      )}

      {/* 근무 조건 */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', margin: '16px 0 10px', paddingBottom: '6px', borderBottom: '1.5px solid var(--color-gray-200)' }}>근무 조건</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {WORK_DAYS_ORDER.map(d => (
          <button key={d} onClick={() => toggleDay(d)} style={{
            width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, border: 'none',
            background: f.work_days.includes(d) ? 'var(--color-primary)' : 'var(--color-gray-100)',
            color: f.work_days.includes(d) ? '#fff' : 'var(--color-gray-700)',
          }}>{d}</button>
        ))}
        <span style={{ fontSize: '12px', color: 'var(--color-gray-500)', alignSelf: 'center' }}>{f.work_days.length}일 선택</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        {inp('start_time', { type: 'time', style: { flex: 1 } })}
        <span style={{ color: 'var(--color-gray-500)', fontSize: '14px' }}>~</span>
        {inp('end_time', { type: 'time', style: { flex: 1 } })}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          value={f.task_description} onChange={e => set('task_description', e.target.value)}
          placeholder="담당 업무 (예: 홀 서빙, 주방 보조)"
          style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => handleSave(true)} disabled={saving} style={{
          flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid var(--color-primary)',
          background: '#fff', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          계약서 생성
        </button>
        <button onClick={() => handleSave(false)} disabled={saving} style={{
          flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
          background: 'var(--color-primary)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

// ── 출퇴근 기록 폼 ───────────────────────────────────────────────────
function AttendanceForm({ workers, initialDate, initialWorkerId, onSave }) {
  const [f, setF] = useState({
    worker_id:    initialWorkerId || '',
    work_date:    initialDate || todayStr(),
    clock_in:     '09:00',
    clock_out:    '18:00',
    break_minutes: 60,
    status:       '정상출근',
    memo:         '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!f.worker_id) return alert('직원을 선택해주세요');
    setSaving(true);
    await fetch('/api/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, break_minutes: parseInt(f.break_minutes) }),
    });
    setSaving(false);
    onSave();
  }

  const hours = calcHours(f.clock_in, f.clock_out, f.break_minutes);

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <select value={f.worker_id} onChange={e => setF(p => ({ ...p, worker_id: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px', background: '#fff', fontFamily: 'inherit' }}>
          <option value="">직원 선택</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <input type="date" value={f.work_date} onChange={e => setF(p => ({ ...p, work_date: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {/* 출퇴근 시간 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <input type="time" value={f.clock_in}  onChange={e => setF(p => ({ ...p, clock_in:  e.target.value }))} style={{ flex: 1, padding: '10px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px' }} />
        <span style={{ color: '#aaa' }}>~</span>
        <input type="time" value={f.clock_out} onChange={e => setF(p => ({ ...p, clock_out: e.target.value }))} style={{ flex: 1, padding: '10px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px' }} />
      </div>

      {/* 휴게시간 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-gray-700)', marginBottom: '6px' }}>
          <span>휴게시간</span><span style={{ fontWeight: 700 }}>{f.break_minutes}분</span>
        </div>
        <input type="range" min="0" max="120" step="10" value={f.break_minutes}
          onChange={e => setF(p => ({ ...p, break_minutes: e.target.value }))}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
      </div>

      {/* 실근무시간 */}
      <div style={{ background: 'var(--color-primary-bg)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
        실근무: {hours.toFixed(1)}시간
      </div>

      {/* 상태 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {Object.entries(STATUS_INFO).map(([s, { color, bg }]) => (
          <button key={s} onClick={() => setF(p => ({ ...p, status: s }))} style={{
            flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700,
            background: f.status === s ? bg : 'var(--color-gray-100)',
            color: f.status === s ? color : 'var(--color-gray-700)',
            outline: f.status === s ? `2px solid ${color}` : 'none',
          }}>{s}</button>
        ))}
      </div>

      <input value={f.memo} onChange={e => setF(p => ({ ...p, memo: e.target.value }))}
        placeholder="메모 (선택)" style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid var(--color-gray-300)', borderRadius: '8px', marginBottom: '16px', fontFamily: 'inherit', boxSizing: 'border-box' }} />

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
        background: 'var(--color-primary)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
      }}>
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function WorkerScheduler() {
  const router = useRouter();
  const today  = new Date();

  const [tab, setTab]           = useState('workers'); // workers | schedule | salary
  const [workers, setWorkers]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');

  // 월/주 네비게이션
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [schedView, setSchedView] = useState('week'); // week | month

  // 모달 상태
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [editWorker,    setEditWorker]    = useState(null);
  const [showAttend,    setShowAttend]    = useState(false);
  const [attendDate,    setAttendDate]    = useState('');
  const [filterWorker,  setFilterWorker]  = useState('all');

  // 토스트
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000); }

  // 직원 불러오기
  const loadWorkers = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/workers');
    const d = await r.json();
    if (d.success) setWorkers(d.data);
    setLoading(false);
  }, []);

  // 스케줄 불러오기
  const loadSchedules = useCallback(async () => {
    const r = await fetch(`/api/schedule?year=${year}&month=${month}`);
    const d = await r.json();
    if (d.success) setSchedules(d.data);
  }, [year, month]);

  useEffect(() => { loadWorkers(); }, [loadWorkers]);
  useEffect(() => { if (tab === 'schedule') loadSchedules(); }, [tab, loadSchedules]);

  // 주간 날짜
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // 날짜별 스케줄 맵 (worker_id + date → record)
  const schedMap = useMemo(() => {
    const m = {};
    schedules.forEach(s => { m[`${s.worker_id}_${s.work_date}`] = s; });
    return m;
  }, [schedules]);

  // 월별 달력
  const calGrid = useMemo(() => {
    const firstDow = new Date(year, month - 1, 1).getDay();
    const days = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [year, month]);

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); }

  // 요일→한국어 매핑
  const dowToKr = (dateStr) => DAY_KR[new Date(dateStr).getDay()];

  // 해당 직원이 해당 날짜에 정규 출근 요일인지
  function isScheduledDay(worker, dateStr) {
    const kr = DAY_KR[new Date(dateStr).getDay()];
    return (worker.work_days || '').split(',').includes(kr);
  }

  // 표시할 직원 목록 (필터)
  const visibleWorkers = filterWorker === 'all' ? workers : workers.filter(w => String(w.id) === filterWorker);

  // ── 삭제 확인 ──
  async function deleteWorker(id) {
    if (!confirm('정말 삭제할까요? 스케줄 기록은 유지됩니다.')) return;
    await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    showToast('직원이 삭제되었습니다');
    loadWorkers();
  }

  // ── 빈 상태 컴포넌트 ──
  function EmptyState({ icon, msg, sub }) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-gray-500)' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '6px' }}>{msg}</div>
        <div style={{ fontSize: '13px' }}>{sub}</div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // TAB 1: 직원관리
  // ════════════════════════════════════════════════════════════════════
  const renderWorkers = () => (
    <div style={{ padding: '0 16px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>우리 직원</span>
          <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>{workers.length}명</span>
        </div>
        <button onClick={() => { setEditWorker(null); setShowAddWorker(true); }} style={{
          padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>+ 직원 추가</button>
      </div>

      {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} h={90} mb={10} />) :
        workers.length === 0 ? <EmptyState icon="👥" msg="등록된 직원이 없어요" sub="+ 직원 추가 버튼을 눌러 등록해보세요" /> :
        workers.map(w => {
          const emp = EMP_BADGE[w.employment_type] || EMP_BADGE['정규'];
          return (
            <div key={w.id} style={{
              background: '#fff', borderRadius: '16px', padding: '16px',
              marginBottom: '10px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={w.name} color={w.color} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>{w.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: emp.bg, color: emp.color }}>{w.employment_type}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-gray-700)' }}>시급 {(w.hourly_wage || MIN_WAGE).toLocaleString()}원</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                    {w.work_days} {w.start_time}~{w.end_time}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button onClick={() => router.push(`/tools/contract?workerId=${w.id}`)} style={{ padding: '5px 10px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>계약서</button>
                  <button onClick={() => { setEditWorker(w); setShowAddWorker(true); }} style={{ padding: '5px 10px', background: 'var(--color-gray-100)', color: 'var(--color-gray-700)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>수정</button>
                  <button onClick={() => deleteWorker(w.id)} style={{ padding: '5px 10px', background: '#fff0f0', color: 'var(--color-danger)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                </div>
              </div>
              {w.task_description && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--color-gray-100)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-gray-700)' }}>
                  💼 {w.task_description}
                </div>
              )}
            </div>
          );
        })
      }
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // TAB 2: 스케줄
  // ════════════════════════════════════════════════════════════════════
  const renderSchedule = () => (
    <div style={{ padding: '0 16px' }}>
      {/* 상단 헤더 */}
      <div style={{ padding: '16px 0 12px' }}>
        {/* 뷰 전환 */}
        <div style={{ display: 'flex', background: 'var(--color-gray-100)', borderRadius: '10px', padding: '3px', marginBottom: '12px' }}>
          {[{ id: 'week', label: '주간' }, { id: 'month', label: '월간' }].map(v => (
            <button key={v.id} onClick={() => setSchedView(v.id)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700,
              background: schedView === v.id ? 'var(--color-primary)' : 'transparent',
              color: schedView === v.id ? '#fff' : 'var(--color-gray-700)',
            }}>{v.label}</button>
          ))}
        </div>

        {/* 월/주 이동 */}
        {schedView === 'week' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={prevWeek} style={navBtn}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              {weekDates[0].slice(5).replace('-', '/')} ~ {weekDates[6].slice(5).replace('-', '/')}
            </span>
            <button onClick={nextWeek} style={navBtn}>›</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{year}년 {month}월</span>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>
        )}

        {/* 직원 필터 */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          <button onClick={() => setFilterWorker('all')} style={{
            padding: '5px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700, flexShrink: 0,
            background: filterWorker === 'all' ? 'var(--color-primary)' : 'var(--color-gray-100)',
            color: filterWorker === 'all' ? '#fff' : 'var(--color-gray-700)',
          }}>전체</button>
          {workers.map(w => (
            <button key={w.id} onClick={() => setFilterWorker(String(w.id))} style={{
              padding: '5px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
              background: filterWorker === String(w.id) ? w.color : 'var(--color-gray-100)',
              color: filterWorker === String(w.id) ? '#fff' : 'var(--color-gray-700)',
            }}>
              <span>{w.name.slice(0, 1)}</span>{w.name}
            </button>
          ))}
        </div>
      </div>

      {workers.length === 0 ? <EmptyState icon="📅" msg="직원을 먼저 등록해주세요" sub="직원관리 탭에서 직원을 추가하세요" /> : (

        schedView === 'week' ? (
          /* ── 주간 뷰 ── */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '12px' }}>
              {weekDates.map((dateStr, idx) => {
                const dow = new Date(dateStr).getDay();
                const isToday = dateStr === todayStr();
                const dayRecords = visibleWorkers.map(w => ({ w, rec: schedMap[`${w.id}_${dateStr}`] }))
                  .filter(({ w, rec }) => rec || isScheduledDay(w, dateStr));

                return (
                  <div key={dateStr}
                    onClick={() => { setAttendDate(dateStr); setShowAttend(true); }}
                    style={{
                      background: isToday ? 'var(--color-primary-bg)' : '#fff',
                      borderRadius: '12px', padding: '8px 4px', cursor: 'pointer',
                      border: isToday ? '2px solid var(--color-primary)' : '1.5px solid var(--color-gray-200)',
                      minHeight: '80px',
                    }}>
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: dow === 0 ? '#e74c3c' : dow === 6 ? '#4f80e1' : 'var(--color-gray-500)' }}>
                        {DAY_KR[dow]}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--color-primary)' : 'var(--color-gray-900)' }}>
                        {parseInt(dateStr.slice(8))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayRecords.slice(0, 3).map(({ w, rec }) => {
                        const st = rec?.status || '정상출근';
                        const si = STATUS_INFO[st];
                        return (
                          <div key={w.id} style={{
                            borderRadius: '4px', padding: '2px 3px',
                            background: rec ? si.bg : w.color + '18',
                            fontSize: '10px', fontWeight: 700, textAlign: 'center',
                            color: rec ? si.color : w.color,
                          }}>
                            {w.name.slice(0, 1)}
                          </div>
                        );
                      })}
                      {dayRecords.length > 3 && <div style={{ fontSize: '10px', color: 'var(--color-gray-500)', textAlign: 'center' }}>+{dayRecords.length-3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 주간 상세 */}
            {visibleWorkers.map(w => (
              <div key={w.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '10px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Avatar name={w.name} color={w.color} size={30} />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{w.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                  {weekDates.map(dateStr => {
                    const rec = schedMap[`${w.id}_${dateStr}`];
                    const scheduled = isScheduledDay(w, dateStr);
                    const si = rec ? STATUS_INFO[rec.status] : null;
                    return (
                      <div key={dateStr} onClick={() => { setAttendDate(dateStr); setShowAttend(true); }}
                        style={{
                          borderRadius: '8px', padding: '6px 2px', textAlign: 'center', cursor: 'pointer',
                          background: rec ? si.bg : scheduled ? w.color + '14' : '#f4f6fb',
                          border: rec ? `1.5px solid ${si.color}30` : 'none',
                        }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: rec ? si.color : scheduled ? w.color : '#ccc' }}>
                          {rec ? rec.status.slice(0, 2) : scheduled ? '예정' : '-'}
                        </div>
                        {rec?.clock_in && <div style={{ fontSize: '10px', color: 'var(--color-gray-500)' }}>{rec.clock_in}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── 월간 뷰 ── */
          <div style={{ background: '#fff', borderRadius: '16px', padding: '14px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '6px' }}>
              {DAY_KR.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, padding: '4px 0',
                  color: i === 0 ? '#e74c3c' : i === 6 ? '#4f80e1' : 'var(--color-gray-500)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
              {calGrid.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
                const dayWorkers = workers.filter(w => schedMap[`${w.id}_${dateStr}`]);
                const isToday = dateStr === todayStr();
                return (
                  <div key={idx} onClick={() => { setAttendDate(dateStr); setShowAttend(true); }}
                    style={{
                      borderRadius: '10px', padding: '6px 2px', textAlign: 'center', cursor: 'pointer',
                      background: isToday ? 'var(--color-primary-bg)' : 'transparent',
                      border: isToday ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}>
                    <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400 }}>{day}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {dayWorkers.slice(0, 3).map(w => (
                        <div key={w.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: w.color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* 출퇴근 기록 버튼 */}
      <button onClick={() => { setAttendDate(todayStr()); setShowAttend(true); }} style={{
        position: 'fixed', bottom: '88px', right: '20px',
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'var(--color-primary)', color: '#fff',
        border: 'none', fontSize: '22px', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(27,71,151,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}>+</button>
    </div>
  );

  const navBtn = {
    width: '32px', height: '32px', border: 'none', background: 'var(--color-gray-100)',
    borderRadius: '8px', cursor: 'pointer', fontSize: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: 'calc(100dvh - 56px)', paddingBottom: '70px' }}>

      {/* 탭 컨텐츠 */}
      {tab === 'workers'  && renderWorkers()}
      {tab === 'schedule' && renderSchedule()}
      {tab === 'salary'   && (
        <div style={{ padding: '0 16px' }}>
          <SalaryTabInner workers={workers} year={year} month={month}
            prevMonth={prevMonth} nextMonth={nextMonth} showToast={showToast} />
        </div>
      )}

      {/* 하단 탭바 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: '#fff', borderTop: '1px solid var(--color-gray-200)',
        display: 'flex', zIndex: 300,
      }}>
        {[
          { id: 'workers',  icon: '👥', label: '직원관리' },
          { id: 'schedule', icon: '📅', label: '스케줄' },
          { id: 'salary',   icon: '💰', label: '급여정산' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0 14px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '10px', fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-gray-500)',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '3px' }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>

      {/* 직원 추가/수정 시트 */}
      <Sheet open={showAddWorker} onClose={() => { setShowAddWorker(false); setEditWorker(null); }}
        title={editWorker ? '직원 수정' : '직원 추가'}>
        <WorkerForm
          initial={editWorker}
          onSave={() => { setShowAddWorker(false); setEditWorker(null); loadWorkers(); showToast('저장되었습니다'); }}
          onContract={(id) => { setShowAddWorker(false); setEditWorker(null); loadWorkers(); router.push(`/tools/contract?workerId=${id}`); }}
        />
      </Sheet>

      {/* 출퇴근 기록 시트 */}
      <Sheet open={showAttend} onClose={() => setShowAttend(false)} title="출퇴근 기록" height="80dvh">
        <AttendanceForm workers={workers} initialDate={attendDate}
          onSave={() => { setShowAttend(false); loadSchedules(); showToast('기록되었습니다'); }} />
      </Sheet>

      <Toast msg={toast} />

      <style>{`
        @keyframes slideUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer  {
          0%   { background: #f0f0f0; }
          50%  { background: #e0e0e0; }
          100% { background: #f0f0f0; }
        }
      `}</style>
    </div>
  );
}

// ── 급여정산 탭 (인라인) ─────────────────────────────────────────────
function SalaryTabInner({ workers, year, month, prevMonth, nextMonth, showToast }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [payslip, setPayslip] = useState(null); // 명세서 팝업

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/salary?year=${year}&month=${month}`);
    const d = await r.json();
    if (d.success) setData(d.data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  async function toggleSettle(item) {
    const next = !item.isSettled;
    await fetch('/api/salary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_id: item.worker.id, year, month,
        is_settled: next,
        total_hours: item.totalHours, total_days: item.totalDays,
        base_wage: item.monthlyBase, weekly_allowance: item.weeklyAllowance,
        deduction: item.deduction, net_wage: item.netWage,
      }),
    });
    showToast(next ? '정산 완료 처리했습니다' : '정산 취소했습니다');
    load();
  }

  const totalNet = data.reduce((s, d) => s + (d.netWage || 0), 0);

  return (
    <div>
      {/* 월 선택 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 14px' }}>
        <button onClick={prevMonth} style={{ width: '32px', height: '32px', border: 'none', background: 'var(--color-gray-100)', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{year}년 {month}월</div>
          <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>총 {data.length}명 · 예상 지출 {totalNet.toLocaleString()}원</div>
        </div>
        <button onClick={nextMonth} style={{ width: '32px', height: '32px', border: 'none', background: 'var(--color-gray-100)', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>›</button>
      </div>

      {loading ? Array(2).fill(0).map((_, i) => <Skeleton key={i} h={180} mb={12} />) :
        data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-gray-500)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>급여 데이터가 없어요</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>스케줄 탭에서 출퇴근을 기록해주세요</div>
          </div>
        ) :
        data.map(item => {
          const settled = item.isSettled;
          return (
            <div key={item.worker.id} style={{
              background: '#fff', borderRadius: '18px', padding: '18px',
              marginBottom: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-200)',
            }}>
              {/* 직원 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={item.worker.name} color={item.worker.color} size={36} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{item.worker.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                      총 {item.totalHours.toFixed(1)}시간 · {item.totalDays}일 출근
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleSettle(item)} style={{
                  padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700,
                  background: settled ? '#e8f8f0' : '#fff8e1',
                  color:      settled ? '#2ecc71' : '#f39c12',
                }}>
                  {settled ? '정산완료 ✅' : '정산 전'}
                </button>
              </div>

              {/* 금액 표 */}
              {[
                { label: '기본급 (월)', amount: item.monthlyBase },
                { label: '주휴수당 (월)', amount: item.weeklyAllowance },
                { label: '4대보험 공제', amount: -item.deduction, danger: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--color-gray-200)' }}>
                  <span style={{ color: 'var(--color-gray-700)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: row.danger ? 'var(--color-danger)' : 'var(--color-gray-900)' }}>
                    {row.danger ? '-' : ''}{Math.abs(row.amount).toLocaleString()}원
                  </span>
                </div>
              ))}

              {/* 실수령액 강조 */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0 0', marginTop: '4px',
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-gray-900)' }}>실수령액</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {item.netWage.toLocaleString()}원
                </span>
              </div>

              {/* 명세서 버튼 */}
              <button onClick={() => setPayslip(item)} style={{
                width: '100%', marginTop: '14px', padding: '11px',
                background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              }}>
                📄 급여명세서 보기
              </button>
            </div>
          );
        })
      }

      {/* 급여명세서 모달 */}
      {payslip && <PayslipModal item={payslip} year={year} month={month} onClose={() => setPayslip(null)} />}
    </div>
  );
}

// ── 급여명세서 모달 ───────────────────────────────────────────────────
function PayslipModal({ item, year, month, onClose }) {
  async function handlePDF() {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const el = document.getElementById('payslip-content');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgW = 210, imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
    pdf.save(`급여명세서_${item.worker.name}_${year}년${month}월.pdf`);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', background: '#fff',
        borderRadius: '20px 20px 0 0', zIndex: 700,
        maxHeight: '90dvh', overflowY: 'auto', animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ padding: '20px' }}>
          <div style={{ width: '40px', height: '4px', background: '#ddd', borderRadius: '2px', margin: '0 auto 16px' }} />

          {/* 명세서 본문 */}
          <div id="payslip-content" style={{ background: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>급여명세서</div>
              <div style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>{year}년 {month}월분</div>
            </div>

            <div style={{ borderTop: '2px solid var(--color-primary)', borderBottom: '1px solid var(--color-gray-200)', padding: '12px 0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>직원명</span>
                <span style={{ fontWeight: 700 }}>{item.worker.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>고용형태</span>
                <span style={{ fontWeight: 700 }}>{item.worker.employment_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>시급</span>
                <span style={{ fontWeight: 700 }}>{(item.worker.hourly_wage || 10030).toLocaleString()}원</span>
              </div>
            </div>

            {/* 지급 내역 */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '8px' }}>지급 내역</div>
            {[
              { label: '기본급', amount: item.monthlyBase },
              { label: '주휴수당', amount: item.weeklyAllowance },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid var(--color-gray-200)' }}>
                <span>{r.label}</span><span style={{ fontWeight: 600 }}>{r.amount.toLocaleString()}원</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', fontWeight: 700 }}>
              <span>세전 합계</span><span>{(item.monthlyBase + item.weeklyAllowance).toLocaleString()}원</span>
            </div>

            {/* 공제 */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gray-700)', margin: '12px 0 8px' }}>공제 내역</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid var(--color-gray-200)' }}>
              <span>4대보험 (근로자)</span><span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>-{item.deduction.toLocaleString()}원</span>
            </div>

            {/* 실수령액 */}
            <div style={{
              background: 'linear-gradient(135deg, #1b4797, #2d5fc4)',
              borderRadius: '10px', padding: '14px', marginTop: '14px', textAlign: 'center',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>실수령액</div>
              <div style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>{item.netWage.toLocaleString()}원</div>
            </div>
          </div>

          {/* PDF 버튼 */}
          <button onClick={handlePDF} style={{
            width: '100%', marginTop: '16px', padding: '14px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}>
            PDF 저장
          </button>
          <button onClick={onClose} style={{
            width: '100%', marginTop: '8px', padding: '12px',
            background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>닫기</button>
        </div>
      </div>
    </>
  );
}
