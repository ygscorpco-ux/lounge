import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const [rows] = await pool.query(
      `SELECT p.id, p.category, p.title, p.content, p.like_count, p.comment_count, p.created_at, u.role
       FROM bookmarks b
       JOIN posts p ON b.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE b.user_id = ? AND p.is_hidden = FALSE
       ORDER BY b.created_at DESC`,
      [user.id]
    );

    const posts = rows.map(row => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content.substring(0, 100),
      author: row.role === 'admin' ? '염광사' : '익명',
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('bookmarks error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { postId } = await request.json();

    const [existing] = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?',
      [user.id, postId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [user.id, postId]);
      return NextResponse.json({ bookmarked: false });
    } else {
      await pool.query('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [user.id, postId]);
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('bookmark toggle error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
