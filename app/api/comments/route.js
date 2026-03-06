import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { containsBannedWord } from '../../../lib/utils.js';
import { ROLE_ADMIN } from '../../../lib/constants.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    const user = await getCurrentUser();
    let blockedIds = [];
    if (user) {
      const [blocks] = await pool.query('SELECT blocked_user_id FROM user_blocks WHERE user_id = ?', [user.id]);
      blockedIds = blocks.map(b => b.blocked_user_id);
    }

    let query = 'SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.like_count, c.created_at, u.role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.is_hidden = FALSE';
    const params = [postId];

    if (blockedIds.length > 0) {
      query += ' AND c.user_id NOT IN (' + blockedIds.map(() => '?').join(',') + ')';
      params.push(...blockedIds);
    }

    query += ' ORDER BY c.created_at ASC';

    const [rows] = await pool.query(query, params);

    let likedSet = new Set();
    if (user && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const [likeRows] = await pool.query(
        `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${placeholders})`,
        [user.id, ...ids]
      );
      likedSet = new Set(likeRows.map((r) => r.comment_id));
    }

    const comments = rows.map((row) => ({
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        parentId: row.parent_id,
        content: row.content,
        author: row.role === 'admin' ? '염광사' : '익명',
        likeCount: row.like_count,
        alreadyLiked: likedSet.has(row.id),
        isAuthor: user && user.id === row.user_id,
        isAdmin: user && user.role === ROLE_ADMIN,
        createdAt: row.created_at
      }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('comments error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { postId, parentId, content } = await request.json();
    if (!postId || !content) return NextResponse.json({ error: 'Fields required' }, { status: 400 });

    const [postRows] = await pool.query(
      'SELECT id, user_id, is_notice, is_hidden FROM posts WHERE id = ?',
      [postId]
    );
    if (postRows.length === 0 || postRows[0].is_hidden) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (postRows[0].is_notice) {
      return NextResponse.json({ error: 'Comments are disabled for notices' }, { status: 403 });
    }

    const hasBanned = await containsBannedWord(content);
    if (hasBanned) return NextResponse.json({ error: 'Inappropriate content' }, { status: 400 });

    await pool.query(
      'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [postId, user.id, parentId || null, content]
    );

    await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);

    if (postRows.length > 0 && postRows[0].user_id !== user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, target_type, target_id, from_user_id) VALUES (?, ?, ?, ?, ?)',
        [postRows[0].user_id, parentId ? 'reply' : 'comment', 'post', postId, user.id]
      );
    }

    if (parentId) {
      const [parentRows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [parentId]);
      if (parentRows.length > 0 && parentRows[0].user_id !== user.id) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, target_type, target_id, from_user_id) VALUES (?, ?, ?, ?, ?)',
          [parentRows[0].user_id, 'reply', 'comment', parentId, user.id]
        );
      }
    }

    return NextResponse.json({ message: 'Comment added' }, { status: 201 });
  } catch (error) {
    console.error('create comment error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    if (!commentId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const [rows] = await pool.query('SELECT user_id, post_id FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAuthor = user.id === rows[0].user_id;
    const isAdmin = user.role === ROLE_ADMIN;
    if (!isAuthor && !isAdmin) return NextResponse.json({ error: 'No permission' }, { status: 403 });

    const [targetRows] = await pool.query(
      'SELECT id FROM comments WHERE id = ? OR parent_id = ?',
      [commentId, commentId]
    );
    const targetIds = targetRows.map((r) => r.id);
    const deletedCount = targetIds.length;

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const placeholders = targetIds.map(() => '?').join(',');
      await conn.query(
        `DELETE FROM comment_likes WHERE comment_id IN (${placeholders})`,
        targetIds
      );
      await conn.query(
        `DELETE FROM reports WHERE target_type = ? AND target_id IN (${placeholders})`,
        ['comment', ...targetIds]
      );
      await conn.query(
        `DELETE FROM comments WHERE id IN (${placeholders})`,
        targetIds
      );
      await conn.query(
        'UPDATE posts SET comment_count = GREATEST(comment_count - ?, 0) WHERE id = ?',
        [deletedCount, rows[0].post_id]
      );

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('delete comment error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
