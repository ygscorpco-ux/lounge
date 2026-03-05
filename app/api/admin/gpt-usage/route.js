export const dynamic = 'force-dynamic';
import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 가능합니다' }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT id, user_id, feature, prompt_tokens, completion_tokens, estimated_cost, created_at
       FROM gpt_usage_log
       ORDER BY created_at DESC
       LIMIT 100`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
