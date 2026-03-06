import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { checkAndHide } from '../../../../../lib/utils.js';
import { REPORT_THRESHOLD } from '../../../../../lib/constants.js';
import { withApiMonitoring } from '../../../../../lib/monitoring.js';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  return withApiMonitoring('posts.report.POST', async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }

      const { id } = params;
      const { reason } = await request.json();

      const [existing] = await pool.query(
        'SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?',
        [user.id, 'post', id],
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Already reported' }, { status: 409 });
      }

      await pool.query(
        'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
        [user.id, 'post', id, reason || ''],
      );
      await pool.query('UPDATE posts SET report_count = report_count + 1 WHERE id = ?', [id]);
      await checkAndHide('post', id, REPORT_THRESHOLD);

      return NextResponse.json({ message: 'Reported' });
    } catch (error) {
      console.error('post report error:', error);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  });
}
