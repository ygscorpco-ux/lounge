import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { ROLE_ADMIN } from '../../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      'SELECT p.id, p.user_id, p.category, p.title, p.content, p.is_notice, p.like_count, p.comment_count, p.created_at, u.role FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.is_hidden = FALSE',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = rows[0];
    const isAdmin = row.role === 'admin';

    const user = await getCurrentUser();
    const isAuthor = user && user.id === row.user_id;
    const isUserAdmin = user && user.role === ROLE_ADMIN;

    let alreadyLiked = false;
    if (user) {
      const [likeRows] = await pool.query(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [id, user.id]
      );
      alreadyLiked = likeRows.length > 0;
    }

    const post = {
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      author: isAdmin ? '염광사' : '익명',
      isNotice: row.is_notice === 1,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at,
      isAuthor,
      isAdmin: isUserAdmin,
      alreadyLiked
    };

    return NextResponse.json({ post });

  } catch (error) {
    console.error('post detail error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id } = params;

    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isAuthor = user.id === rows[0].user_id;
    const isAdmin = user.role === ROLE_ADMIN;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    await pool.query('DELETE FROM post_likes WHERE post_id = ?', [id]);
    await pool.query('DELETE FROM reports WHERE target_type = ? AND target_id = ?', ['post', id]);
    await pool.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)', [id]);
    await pool.query('DELETE FROM reports WHERE target_type = ? AND target_id IN (SELECT id FROM comments WHERE post_id = ?)', ['comment', id]);
    await pool.query('DELETE FROM comments WHERE post_id = ?', [id]);
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Deleted' });

  } catch (error) {
    console.error('delete error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}