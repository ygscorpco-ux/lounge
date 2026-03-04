import pool from '../../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    if (!keyword) return NextResponse.json({ posts: [] });

    const like = '%' + keyword + '%';
    const [rows] = await pool.query(
      `SELECT p.id, p.user_id, p.category, p.title, p.content, p.like_count, p.comment_count, p.created_at, u.role
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.is_hidden = FALSE AND (p.title LIKE ? OR p.content LIKE ?)
       ORDER BY p.created_at DESC LIMIT 30`,
      [like, like]
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
    console.error('search error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}