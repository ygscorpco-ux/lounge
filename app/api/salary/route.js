import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

const WEEKS_PER_MONTH   = 4.345;
const EMPLOYEE_DEDUCT   = 0.0905; // 근로자 4대보험 합산 약 9.05%

// 급여 계산 헬퍼
function calcSalary(worker, totalHours, totalDays) {
  const weeklyHours = (totalHours / WEEKS_PER_MONTH);
  const hasWeeklyPay = weeklyHours >= 15;

  const days          = parseFloat(worker.work_days?.split(',').length || 5);
  const dailyHours    = parseFloat(worker.end_time?.split(':')[0] || 9) -
                        parseFloat(worker.start_time?.split(':')[0] || 0) - 1; // 휴게 1h 기본

  const monthlyBase       = Math.round(worker.hourly_wage * totalHours);
  const weeklyAllowance   = hasWeeklyPay
    ? Math.round(worker.hourly_wage * 8 * (days / 5) * WEEKS_PER_MONTH)
    : 0;
  const grossWage         = monthlyBase + weeklyAllowance;
  const deduction         = Math.round(grossWage * EMPLOYEE_DEDUCT);
  const netWage           = grossWage - deduction;

  return { monthlyBase, weeklyAllowance, grossWage, deduction, netWage };
}

// 급여 조회
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year  = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));

    // 내 직원 목록
    const [workers] = await pool.query(
      'SELECT * FROM workers WHERE user_id = ? AND is_active = 1',
      [user.id]
    );

    // 해당 월 출퇴근 기록 집계
    const [schedules] = await pool.query(
      `SELECT ws.worker_id,
              COUNT(*) as total_days,
              SUM(
                TIMESTAMPDIFF(MINUTE,
                  STR_TO_DATE(ws.clock_in, '%H:%i'),
                  STR_TO_DATE(ws.clock_out, '%H:%i')
                ) / 60 - ws.break_minutes / 60
              ) as total_hours
       FROM work_schedule ws
       JOIN workers w ON w.id = ws.worker_id
       WHERE w.user_id = ?
         AND YEAR(ws.work_date) = ?
         AND MONTH(ws.work_date) = ?
         AND ws.status != '결근'
         AND ws.clock_in IS NOT NULL
         AND ws.clock_out IS NOT NULL
       GROUP BY ws.worker_id`,
      [user.id, year, month]
    );

    // 정산 상태 조회
    const [records] = await pool.query(
      `SELECT * FROM salary_record WHERE worker_id IN (${workers.map(() => '?').join(',') || '0'}) AND year = ? AND month = ?`,
      [...workers.map(w => w.id), year, month]
    );
    const recordMap = Object.fromEntries(records.map(r => [r.worker_id, r]));
    const schedMap  = Object.fromEntries(schedules.map(s => [s.worker_id, s]));

    const data = workers.map(w => {
      const sched  = schedMap[w.id];
      const record = recordMap[w.id];
      const totalHours = sched ? parseFloat(sched.total_hours || 0) : 0;
      const totalDays  = sched ? parseInt(sched.total_days  || 0) : 0;

      const calc = calcSalary(w, totalHours, totalDays);

      return {
        worker: {
          id: w.id, name: w.name, color: w.color,
          employment_type: w.employment_type,
          hourly_wage: w.hourly_wage,
        },
        totalHours, totalDays,
        ...calc,
        isSettled:   record?.is_settled === 1,
        settledAt:   record?.settled_at || null,
        recordId:    record?.id || null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('salary GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 정산 상태 토글 (저장/업데이트)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const { worker_id, year, month, is_settled, total_hours, total_days,
            base_wage, weekly_allowance, deduction, net_wage } = await request.json();

    // 내 직원인지 확인
    const [[worker]] = await pool.query('SELECT id FROM workers WHERE id = ? AND user_id = ?', [worker_id, user.id]);
    if (!worker) return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });

    await pool.query(
      `INSERT INTO salary_record (worker_id, year, month, total_hours, total_days, base_wage, weekly_allowance, deduction, net_wage, is_settled, settled_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         total_hours       = VALUES(total_hours),
         total_days        = VALUES(total_days),
         base_wage         = VALUES(base_wage),
         weekly_allowance  = VALUES(weekly_allowance),
         deduction         = VALUES(deduction),
         net_wage          = VALUES(net_wage),
         is_settled        = VALUES(is_settled),
         settled_at        = VALUES(settled_at)`,
      [
        worker_id, year, month, total_hours, total_days,
        base_wage, weekly_allowance, deduction, net_wage,
        is_settled ? 1 : 0,
        is_settled ? new Date() : null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
