import pool from '../../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const year     = searchParams.get('year');
    const month    = searchParams.get('month');

    let query = 'SELECT * FROM subsidies WHERE is_active = 1';
    const params = [];

    // 카테고리 필터
    if (category && category !== '전체') {
      query += ' AND category = ?';
      params.push(category);
    }

    // 해당 월에 걸쳐 있는 지원금만 조회 (start_date ~ end_date 범위)
    if (year && month) {
      const y = parseInt(year);
      const m = parseInt(month);
      // 해당 월의 첫날과 마지막날
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay  = new Date(y, m, 0).toISOString().slice(0, 10);
      query += ' AND end_date >= ? AND (start_date IS NULL OR start_date <= ?)';
      params.push(firstDay, lastDay);
    }

    query += ' ORDER BY end_date ASC';

    const [rows] = await pool.query(query, params);

    // Date → string 직렬화
    const data = rows.map(r => ({
      ...r,
      start_date: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
      end_date:   r.end_date.toISOString().slice(0, 10),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('subsidy list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
