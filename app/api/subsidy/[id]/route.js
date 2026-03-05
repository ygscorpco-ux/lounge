import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 단건 조회
export async function GET(request, { params }) {
  try {
    const [rows] = await pool.query('SELECT * FROM subsidy_calendar WHERE id = ? AND is_active = 1', [params.id]);
    if (!rows.length) return NextResponse.json({ success: false, error: '없는 지원금입니다' }, { status: 404 });
    const r = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        ...r,
        start_date: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
        end_date:   r.end_date.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 수정
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 수정할 수 있습니다' }, { status: 403 });
    }
    const body = await request.json();
    const { title, category, start_date, end_date, target, description, url, amount } = body;
    await pool.query(
      `UPDATE subsidy_calendar SET title=?, category=?, start_date=?, end_date=?, target=?, description=?, apply_url=?, amount=? WHERE id=?`,
      [title, category, start_date || null, end_date, target || null, description || null, url || null, amount || null, params.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 삭제 (소프트 딜리트)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 삭제할 수 있습니다' }, { status: 403 });
    }
    await pool.query('UPDATE subsidy_calendar SET is_active = 0 WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
