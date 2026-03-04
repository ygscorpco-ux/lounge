import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [id, user.id]);
      await pool.query('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [id]);
      return NextResponse.json({ message: 'unliked', liked: false });
    } else {
      await pool.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [id, user.id]);
      await pool.query('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [id]);
      return NextResponse.json({ message: 'liked', liked: true });
    }

  } catch (error) {
    console.error('like error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
