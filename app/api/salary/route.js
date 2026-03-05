import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { getCurrentInsuranceRates } from '../../../lib/constants.js';
import { NextResponse } from 'next/server';

const WEEKS_PER_MONTH = 52 / 12;
const IR = getCurrentInsuranceRates();
const EMPLOYEE_DEDUCT_RATE =
  IR.nationalPensionEmployee + IR.healthEmployee + IR.employmentEmployee;

function calcSalary(worker, totalHours, totalDays) {
  const weeklyHours = totalHours / WEEKS_PER_MONTH;
  const isRegular = worker.employment_type === '정규';
  const hasWeeklyPay = isRegular && weeklyHours >= 15;

  const monthlyBase = Math.round(worker.hourly_wage * totalHours);
  const weeklyAllowanceHours = hasWeeklyPay
    ? Math.min(8, (weeklyHours / 40) * 8)
    : 0;
  const weeklyAllowance = hasWeeklyPay
    ? Math.round(worker.hourly_wage * weeklyAllowanceHours * WEEKS_PER_MONTH)
    : 0;

  const grossWage = monthlyBase + weeklyAllowance;
  const deduction = isRegular
    ? Math.round(grossWage * EMPLOYEE_DEDUCT_RATE)
    : 0;
  const netWage = grossWage - deduction;

  return { monthlyBase, weeklyAllowance, grossWage, deduction, netWage };
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Login required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json(
        { success: false, error: 'year/month required' },
        { status: 400 }
      );
    }

    const [workers] = await pool.query(
      'SELECT * FROM workers WHERE user_id = ? AND is_active = 1',
      [user.id]
    );

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

    const workerIds = workers.map((w) => w.id);
    const [records] = await pool.query(
      `SELECT * FROM salary_record WHERE worker_id IN (${workerIds.map(() => '?').join(',') || '0'}) AND year = ? AND month = ?`,
      [...workerIds, year, month]
    );

    const recordMap = Object.fromEntries(records.map((r) => [r.worker_id, r]));
    const schedMap = Object.fromEntries(schedules.map((s) => [s.worker_id, s]));

    const data = workers.map((w) => {
      const sched = schedMap[w.id];
      const record = recordMap[w.id];
      const totalHours = sched ? parseFloat(sched.total_hours || 0) : 0;
      const totalDays = sched ? parseInt(sched.total_days || 0) : 0;

      const calc = calcSalary(w, totalHours, totalDays);

      return {
        worker: {
          id: w.id,
          name: w.name,
          color: w.color,
          employment_type: w.employment_type,
          hourly_wage: w.hourly_wage,
        },
        totalHours,
        totalDays,
        ...calc,
        isSettled: record?.is_settled === 1,
        settledAt: record?.settled_at || null,
        recordId: record?.id || null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('salary GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Login required' },
        { status: 401 }
      );
    }

    const {
      worker_id,
      year,
      month,
      is_settled,
      total_hours,
      total_days,
      base_wage,
      weekly_allowance,
      deduction,
      net_wage,
    } = await request.json();

    const [[worker]] = await pool.query(
      'SELECT id FROM workers WHERE id = ? AND user_id = ?',
      [worker_id, user.id]
    );
    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'No permission' },
        { status: 403 }
      );
    }

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
        worker_id,
        year,
        month,
        total_hours,
        total_days,
        base_wage,
        weekly_allowance,
        deduction,
        net_wage,
        is_settled ? 1 : 0,
        is_settled ? new Date() : null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
