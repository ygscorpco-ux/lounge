import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 스케줄 조회 (월별)
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year  = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ success: false, error: 'year, month 파라미터가 필요합니다' }, { status: 400 });
    }

    // 내 직원의 출퇴근 기록만 조회
    const [rows] = await pool.query(
      `SELECT ws.*, w.name, w.color
       FROM work_schedule ws
       JOIN workers w ON w.id = ws.worker_id
       WHERE w.user_id = ?
         AND YEAR(ws.work_date) = ?
         AND MONTH(ws.work_date) = ?
       ORDER BY ws.work_date ASC`,
      [user.id, year, month]
    );

    const data = rows.map(r => ({
      ...r,
      work_date: r.work_date.toISOString().slice(0, 10),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 출퇴근 기록 등록/수정 (upsert)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const { worker_id, work_date, clock_in, clock_out, break_minutes, status, memo } = await request.json();

    if (!worker_id || !work_date) {
      return NextResponse.json({ success: false, error: '직원과 날짜는 필수입니다' }, { status: 400 });
    }

    // 내 직원인지 확인
    const [[worker]] = await pool.query('SELECT id FROM workers WHERE id = ? AND user_id = ?', [worker_id, user.id]);
    if (!worker) return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });

    await pool.query(
      `INSERT INTO work_schedule (worker_id, work_date, clock_in, clock_out, break_minutes, status, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         clock_in       = VALUES(clock_in),
         clock_out      = VALUES(clock_out),
         break_minutes  = VALUES(break_minutes),
         status         = VALUES(status),
         memo           = VALUES(memo)`,
      [worker_id, work_date, clock_in || null, clock_out || null,
       break_minutes ?? 60, status || '정상출근', memo || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
