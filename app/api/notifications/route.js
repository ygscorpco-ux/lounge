import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const [rows] = await pool.query(
      `SELECT n.id, n.type, n.target_type, n.target_id, n.is_read, n.created_at
       FROM notifications n
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT 30`,
      [user.id]
    );

    const [unread] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user.id]
    );

    return NextResponse.json({ notifications: rows, unreadCount: unread[0].count });
  } catch (error) {
    console.error('notifications error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [user.id]);
    return NextResponse.json({ message: 'All read' });
  } catch (error) {
    console.error('read notifications error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
