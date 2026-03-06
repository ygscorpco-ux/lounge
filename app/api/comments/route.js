import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { containsBannedWord } from '../../../lib/utils.js';
import { ROLE_ADMIN } from '../../../lib/constants.js';
import {
  clearIdempotencyKey,
  completeIdempotencyKey,
  hashIdempotencyPayload,
  reserveIdempotencyKey,
} from '../../../lib/idempotency.js';
import { withApiMonitoring } from '../../../lib/monitoring.js';
import { NextResponse } from 'next/server';

const ADMIN_DISPLAY_NAME = '\uC5FC\uAD11\uC0AC';
const ANON_DISPLAY_NAME = '\uC775\uBA85';

function normalizeContent(content) {
  return typeof content === 'string' ? content.trim() : '';
}

export async function GET(request) {
  return withApiMonitoring('comments.GET', async () => {
    try {
      const { searchParams } = new URL(request.url);
      const postId = Number(searchParams.get('postId'));
      if (!Number.isInteger(postId) || postId <= 0) {
        return NextResponse.json({ error: 'postId required' }, { status: 400 });
      }

      const user = await getCurrentUser();
      let blockedIds = [];
      if (user) {
        const [blocks] = await pool.query(
          'SELECT blocked_user_id FROM user_blocks WHERE user_id = ?',
          [user.id],
        );
        blockedIds = blocks.map((block) => block.blocked_user_id);
      }

      let query =
        'SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.like_count, c.created_at, u.role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.is_hidden = FALSE';
      const params = [postId];

      if (blockedIds.length > 0) {
        query += ' AND c.user_id NOT IN (' + blockedIds.map(() => '?').join(',') + ')';
        params.push(...blockedIds);
      }

      query += ' ORDER BY c.created_at ASC';

      const [rows] = await pool.query(query, params);

      let likedSet = new Set();
      if (user && rows.length > 0) {
        const ids = rows.map((row) => row.id);
        const placeholders = ids.map(() => '?').join(',');
        const [likeRows] = await pool.query(
          `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${placeholders})`,
          [user.id, ...ids],
        );
        likedSet = new Set(likeRows.map((row) => row.comment_id));
      }

      const comments = rows.map((row) => ({
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        parentId: row.parent_id,
        content: row.content,
        author: row.role === 'admin' ? ADMIN_DISPLAY_NAME : ANON_DISPLAY_NAME,
        likeCount: row.like_count,
        alreadyLiked: likedSet.has(row.id),
        isAuthor: !!(user && user.id === row.user_id),
        isAdmin: !!(user && user.role === ROLE_ADMIN),
        createdAt: row.created_at,
      }));

      return NextResponse.json({ comments });
    } catch (error) {
      console.error('comments error:', error);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  });
}

export async function POST(request) {
  return withApiMonitoring('comments.POST', async () => {
    let user = null;
    let idempotencyKey = '';
    let idempotencyReserved = false;

    try {
      user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }

      const body = await request.json();
      const postId = Number(body.postId);
      const parentId = body.parentId ? Number(body.parentId) : null;
      const content = normalizeContent(body.content);

      if (!Number.isInteger(postId) || postId <= 0 || !content) {
        return NextResponse.json({ error: 'Fields required' }, { status: 400 });
      }
      if (body.parentId && (!Number.isInteger(parentId) || parentId <= 0)) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
      }

      idempotencyKey =
        (request.headers.get('x-idempotency-key') || '').trim().slice(0, 128);
      const requestHash = hashIdempotencyPayload({
        postId,
        parentId: parentId || null,
        content,
      });
      const idempotency = await reserveIdempotencyKey({
        userId: user.id,
        scope: 'comments.create',
        idempotencyKey,
        requestHash,
      });
      if (idempotency.mode === 'conflict') {
        return NextResponse.json(
          { error: 'Idempotency key reused with different payload' },
          { status: 409 },
        );
      }
      if (idempotency.mode === 'processing') {
        return NextResponse.json(
          { error: 'Same request is already being processed' },
          { status: 409 },
        );
      }
      if (idempotency.mode === 'replay') {
        return NextResponse.json(idempotency.body, { status: idempotency.status });
      }
      idempotencyReserved = idempotency.mode === 'new';

      const [postRows] = await pool.query(
        'SELECT id, user_id, is_notice, is_hidden FROM posts WHERE id = ?',
        [postId],
      );
      if (postRows.length === 0 || postRows[0].is_hidden) {
        const responseBody = { error: 'Post not found' };
        if (idempotencyReserved) {
          await completeIdempotencyKey({
            userId: user.id,
            scope: 'comments.create',
            idempotencyKey,
            status: 404,
            body: responseBody,
          });
        }
        return NextResponse.json(responseBody, { status: 404 });
      }
      if (postRows[0].is_notice) {
        const responseBody = { error: 'Comments are disabled for notices' };
        if (idempotencyReserved) {
          await completeIdempotencyKey({
            userId: user.id,
            scope: 'comments.create',
            idempotencyKey,
            status: 403,
            body: responseBody,
          });
        }
        return NextResponse.json(responseBody, { status: 403 });
      }

      const hasBanned = await containsBannedWord(content);
      if (hasBanned) {
        const responseBody = { error: 'Inappropriate content' };
        if (idempotencyReserved) {
          await completeIdempotencyKey({
            userId: user.id,
            scope: 'comments.create',
            idempotencyKey,
            status: 400,
            body: responseBody,
          });
        }
        return NextResponse.json(responseBody, { status: 400 });
      }

      const [dupRows] = await pool.query(
        `SELECT id
         FROM comments
         WHERE user_id = ?
           AND post_id = ?
           AND parent_id <=> ?
           AND content = ?
           AND created_at >= (NOW() - INTERVAL 15 SECOND)
         ORDER BY id DESC
         LIMIT 1`,
        [user.id, postId, parentId || null, content],
      );
      if (dupRows.length > 0) {
        const responseBody = { error: 'Duplicate submission detected' };
        if (idempotencyReserved) {
          await completeIdempotencyKey({
            userId: user.id,
            scope: 'comments.create',
            idempotencyKey,
            status: 409,
            body: responseBody,
          });
        }
        return NextResponse.json(responseBody, { status: 409 });
      }

      const [insertResult] = await pool.query(
        'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
        [postId, user.id, parentId || null, content],
      );

      await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [
        postId,
      ]);

      if (postRows[0].user_id !== user.id) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, target_type, target_id, from_user_id) VALUES (?, ?, ?, ?, ?)',
          [postRows[0].user_id, parentId ? 'reply' : 'comment', 'post', postId, user.id],
        );
      }

      if (parentId) {
        const [parentRows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [
          parentId,
        ]);
        if (parentRows.length > 0 && parentRows[0].user_id !== user.id) {
          await pool.query(
            'INSERT INTO notifications (user_id, type, target_type, target_id, from_user_id) VALUES (?, ?, ?, ?, ?)',
            [parentRows[0].user_id, 'reply', 'comment', parentId, user.id],
          );
        }
      }

      const responseBody = { message: 'Comment added', commentId: insertResult.insertId };
      if (idempotencyReserved) {
        await completeIdempotencyKey({
          userId: user.id,
          scope: 'comments.create',
          idempotencyKey,
          status: 201,
          body: responseBody,
        });
      }

      return NextResponse.json(responseBody, { status: 201 });
    } catch (error) {
      if (idempotencyReserved && user) {
        try {
          await clearIdempotencyKey({
            userId: user.id,
            scope: 'comments.create',
            idempotencyKey,
          });
        } catch (cleanupError) {
          console.error('comments idempotency cleanup error:', cleanupError);
        }
      }
      console.error('create comment error:', error);
      return NextResponse.json({ error: 'server error' }, { status: 500 });
    }
  });
}

export async function DELETE(request) {
  return withApiMonitoring('comments.DELETE', async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const commentId = Number(searchParams.get('id'));
      if (!Number.isInteger(commentId) || commentId <= 0) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
      }

      const [rows] = await pool.query('SELECT user_id, post_id FROM comments WHERE id = ?', [
        commentId,
      ]);
      if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const isAuthor = user.id === rows[0].user_id;
      const isAdmin = user.role === ROLE_ADMIN;
      if (!isAuthor && !isAdmin) {
        return NextResponse.json({ error: 'No permission' }, { status: 403 });
      }

      const [targetRows] = await pool.query(
        'SELECT id FROM comments WHERE id = ? OR parent_id = ?',
        [commentId, commentId],
      );
      const targetIds = targetRows.map((row) => row.id);
      const deletedCount = targetIds.length;

      if (deletedCount === 0) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const placeholders = targetIds.map(() => '?').join(',');
        await conn.query(`DELETE FROM comment_likes WHERE comment_id IN (${placeholders})`, targetIds);
        await conn.query(
          `DELETE FROM reports WHERE target_type = ? AND target_id IN (${placeholders})`,
          ['comment', ...targetIds],
        );
        await conn.query(`DELETE FROM comments WHERE id IN (${placeholders})`, targetIds);
        await conn.query(
          'UPDATE posts SET comment_count = GREATEST(comment_count - ?, 0) WHERE id = ?',
          [deletedCount, rows[0].post_id],
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
  });
}
