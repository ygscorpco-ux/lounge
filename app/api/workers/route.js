import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 내 직원 목록 조회
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const [rows] = await pool.query(
      'SELECT * FROM workers WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC',
      [user.id]
    );

    const data = rows.map(r => ({
      ...r,
      birth_date:     r.birth_date     ? r.birth_date.toISOString().slice(0, 10)     : null,
      contract_start: r.contract_start ? r.contract_start.toISOString().slice(0, 10) : null,
      contract_end:   r.contract_end   ? r.contract_end.toISOString().slice(0, 10)   : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 직원 등록
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const body = await request.json();
    const {
      name, phone, birth_date, employment_type,
      hourly_wage, work_days, start_time, end_time,
      contract_start, contract_end, task_description, color,
    } = body;

    if (!name) return NextResponse.json({ success: false, error: '이름은 필수입니다' }, { status: 400 });

    const COLORS = ['#1b4797', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#3498db', '#e67e22'];
    const [[countRow]] = await pool.query('SELECT COUNT(*) as cnt FROM workers WHERE user_id = ? AND is_active=1', [user.id]);
    const autoColor = color || COLORS[countRow.cnt % COLORS.length];

    const [result] = await pool.query(
      `INSERT INTO workers
        (user_id, name, phone, birth_date, employment_type, hourly_wage, work_days,
         start_time, end_time, contract_start, contract_end, task_description, color)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        user.id, name, phone || null, birth_date || null,
        employment_type || '정규', hourly_wage || 10320,
        Array.isArray(work_days) ? work_days.join(',') : (work_days || '월,화,수,목,금'),
        start_time || '09:00', end_time || '18:00',
        contract_start || null, contract_end || null,
        task_description || null, autoColor,
      ]
    );

    return NextResponse.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
