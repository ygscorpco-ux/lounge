import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { ROLE_ADMIN } from '../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const [rows] = await pool.query(
      'SELECT id, content, is_read, created_at FROM messages WHERE receiver_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    return NextResponse.json({ messages: rows });

  } catch (error) {
    console.error('messages error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver and content required' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [user.id, receiverId, content]
    );

    return NextResponse.json({ message: 'Message sent' }, { status: 201 });

  } catch (error) {
    console.error('send message error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
