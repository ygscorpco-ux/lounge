import pool from '../../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const year     = searchParams.get('year');
    const month    = searchParams.get('month');

    let query = 'SELECT * FROM subsidy_calendar WHERE is_active = 1';
    const params = [];

    // 카테고리 필터
    if (category && category !== '전체') {
      query += ' AND category = ?';
      params.push(category);
    }

    // 월 필터: year/month가 명시적으로 전달된 경우만 적용
    // 전달되지 않으면 전체 지원금 조회 (마감 포함, 프론트에서 정렬 처리)
    if (year && year !== 'all' && month) {
      const y = parseInt(year);
      const m = parseInt(month);
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
    console.error('[subsidy list]', error.message);
    return NextResponse.json({ success: false, error: '지원금 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
