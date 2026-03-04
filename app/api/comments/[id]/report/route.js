import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { checkAndHide } from '../../../../../lib/utils.js';
import { REPORT_THRESHOLD } from '../../../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    const [existing] = await pool.query(
      'SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?',
      [user.id, 'comment', id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: '이미 신고한 댓글입니다' }, { status: 409 });
    }

    await pool.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [user.id, 'comment', id, reason || '']
    );

    await pool.query('UPDATE comments SET report_count = report_count + 1 WHERE id = ?', [id]);

    await checkAndHide('comment', id, REPORT_THRESHOLD);

    return NextResponse.json({ message: '신고 완료' });

  } catch (error) {
    console.error('댓글 신고 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}