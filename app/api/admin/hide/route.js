import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { ROLE_ADMIN } from '../../../../lib/constants.js';
import { withApiMonitoring } from '../../../../lib/monitoring.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  return withApiMonitoring('admin.hide.POST', async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== ROLE_ADMIN) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }

      const { targetType, targetId, hide } = await request.json();
      const table = targetType === 'post' ? 'posts' : 'comments';

      await pool.query(
        'UPDATE ' + table + ' SET is_hidden = ? WHERE id = ?',
        [hide ? true : false, targetId]
      );

      return NextResponse.json({ message: hide ? 'Hidden' : 'Unhidden' });
    } catch (error) {
      console.error('hide error:', error);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  });
}
