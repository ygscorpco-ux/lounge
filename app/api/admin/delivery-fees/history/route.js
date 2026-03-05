export const dynamic = 'force-dynamic';
import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 수수료 변경 이력 최근 50건 조회
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 가능합니다' }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT h.*, u.username as changed_by_name
       FROM delivery_fee_history h
       LEFT JOIN users u ON u.id = h.changed_by
       ORDER BY h.changed_at DESC
       LIMIT 50`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
