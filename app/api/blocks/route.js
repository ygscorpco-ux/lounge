import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const [rows] = await pool.query(
      'SELECT blocked_user_id FROM user_blocks WHERE user_id = ?',
      [user.id]
    );

    return NextResponse.json({ blockedUsers: rows.map(r => r.blocked_user_id) });
  } catch (error) {
    console.error('blocks error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { userId } = await request.json();
    if (userId === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

    const [existing] = await pool.query(
      'SELECT id FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?',
      [user.id, userId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?', [user.id, userId]);
      return NextResponse.json({ blocked: false });
    } else {
      await pool.query('INSERT INTO user_blocks (user_id, blocked_user_id) VALUES (?, ?)', [user.id, userId]);
      return NextResponse.json({ blocked: true });
    }
  } catch (error) {
    console.error('block toggle error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
