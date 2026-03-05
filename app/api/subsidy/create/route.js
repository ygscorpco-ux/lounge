import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 등록할 수 있습니다' }, { status: 403 });
    }

    const { title, category, start_date, end_date, target, description, url, amount } = await request.json();

    if (!title || !category || !end_date) {
      return NextResponse.json({ success: false, error: '제목·카테고리·마감일은 필수입니다' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO subsidies (title, category, start_date, end_date, target, description, url, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, category, start_date || null, end_date, target || null, description || null, url || null, amount || null]
    );

    return NextResponse.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('subsidy create error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
