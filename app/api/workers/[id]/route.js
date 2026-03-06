import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { getCurrentMinWage } from '../../../../lib/constants.js';
import { NextResponse } from 'next/server';

const MIN_WAGE = getCurrentMinWage();

function normalizeEmploymentType(value) {
  if (value === '단기' || value === 'temp') return '단기';
  if (value === '일용' || value === 'daily') return '일용';
  return '정규';
}

async function retryAfterEmploymentTypeFix(task) {
  try {
    return await task();
  } catch (error) {
    if (!/employment_type/i.test(error.message)) {
      throw error;
    }

    try {
      await pool.query(`
        ALTER TABLE workers
        MODIFY COLUMN employment_type VARCHAR(10)
        NOT NULL DEFAULT '정규'
      `);
      return await task();
    } catch {
      throw error;
    }
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const [rows] = await pool.query(
      'SELECT * FROM workers WHERE id = ? AND user_id = ? AND is_active = 1',
      [params.id, user.id]
    );
    if (!rows.length) return NextResponse.json({ success: false, error: '직원을 찾을 수 없습니다' }, { status: 404 });

    const r = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        ...r,
        birth_date:     r.birth_date     ? r.birth_date.toISOString().slice(0, 10)     : null,
        contract_start: r.contract_start ? r.contract_start.toISOString().slice(0, 10) : null,
        contract_end:   r.contract_end   ? r.contract_end.toISOString().slice(0, 10)   : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const body = await request.json();
    const {
      name, phone, birth_date, employment_type,
      hourly_wage, work_days, start_time, end_time,
      contract_start, contract_end, task_description, color,
    } = body;

    const normalizedEmploymentType = normalizeEmploymentType(employment_type);

    await retryAfterEmploymentTypeFix(() => pool.query(
      `UPDATE workers SET
        name=?, phone=?, birth_date=?, employment_type=?, hourly_wage=?,
        work_days=?, start_time=?, end_time=?, contract_start=?, contract_end=?,
        task_description=?, color=?
       WHERE id = ? AND user_id = ?`,
      [
        name, phone || null, birth_date || null, normalizedEmploymentType,
        hourly_wage || MIN_WAGE,
        Array.isArray(work_days) ? work_days.join(',') : (work_days || '월,화,수,목,금'),
        start_time || '09:00', end_time || '18:00',
        contract_start || null, contract_end || null,
        task_description || null, color || '#1b4797',
        params.id, user.id,
      ]
    ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    await pool.query('UPDATE workers SET is_active = 0 WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
