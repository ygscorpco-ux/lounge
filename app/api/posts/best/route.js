import pool from '../../../../lib/db.js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.user_id, p.category, p.title, p.content, p.like_count, p.comment_count, p.created_at, u.role
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.is_hidden = FALSE AND p.is_notice = FALSE AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY p.like_count DESC, p.comment_count DESC
       LIMIT 5`
    );

    const posts = rows.map(row => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content.substring(0, 60),
      author: row.role === 'admin' ? '염광사' : '익명',
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at
    }));

    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('best error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
