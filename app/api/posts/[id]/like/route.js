import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { id } = params;

    const [existing] = await pool.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [id, user.id]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, user.id]);
      await pool.query('UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id]);
      return NextResponse.json({ liked: false });
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, user.id]);
      await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [id]);

      const [postRows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
      if (postRows.length > 0 && postRows[0].user_id !== user.id) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, target_type, target_id, from_user_id) VALUES (?, ?, ?, ?, ?)',
          [postRows[0].user_id, 'like', 'post', id, user.id]
        );
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('like error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
