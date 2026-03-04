import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { ROLE_ADMIN } from '../../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { userId, ban } = await request.json();

    await pool.query(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [ban ? true : false, userId]
    );

    return NextResponse.json({ message: ban ? 'User banned' : 'User unbanned' });

  } catch (error) {
    console.error('ban error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
