import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { containsBannedWord } from '../../../lib/utils.js';
import { PAGE_SIZE } from '../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const category = searchParams.get('category');
    const offset = (page - 1) * PAGE_SIZE;

    let query = 'SELECT id, user_id, category, title, content, is_notice, like_count, comment_count, created_at FROM posts WHERE is_hidden = FALSE';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY is_notice DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(PAGE_SIZE, offset);

    const [rows] = await pool.query(query, params);

    const posts = [];
    for (const row of rows) {
      const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [row.user_id]);
      const isAdmin = userRows.length > 0 && userRows[0].role === 'admin';

      posts.push({
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content.substring(0, 100),
        author: isAdmin ? '염광사' : '익명',
        isNotice: row.is_notice === 1,
        likeCount: row.like_count,
        commentCount: row.comment_count,
        createdAt: row.created_at
      });
    }

    return NextResponse.json({ posts, page, pageSize: PAGE_SIZE });

  } catch (error) {
    console.error('posts list error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const [banned] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [user.id]);
    if (banned.length > 0 && banned[0].is_banned) {
      return NextResponse.json({ error: 'Account restricted' }, { status: 403 });
    }

    const { category, title, content } = await request.json();

    if (!category || !title || !content) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const hasBanned = await containsBannedWord(title + ' ' + content);
    if (hasBanned) {
      return NextResponse.json({ error: 'Inappropriate content detected' }, { status: 400 });
    }

    if (category === 'YK' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only category' }, { status: 403 });
    }

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, category, title, content) VALUES (?, ?, ?, ?)',
      [user.id, category, title, content]
    );

    return NextResponse.json({ message: 'Posted', postId: result.insertId }, { status: 201 });

  } catch (error) {
    console.error('create post error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
