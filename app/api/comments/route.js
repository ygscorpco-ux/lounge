import pool from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { containsBannedWord } from '../../../lib/utils.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId가 필요합니다' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT c.id, c.user_id, c.parent_id, c.content, c.like_count, c.created_at, u.role FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.is_hidden = FALSE ORDER BY c.created_at ASC',
      [postId]
    );

    const user = await getCurrentUser();

    const comments = [];
    for (const row of rows) {
      let alreadyLiked = false;
      if (user) {
        const [likeRows] = await pool.query(
          'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
          [row.id, user.id]
        );
        alreadyLiked = likeRows.length > 0;
      }

      comments.push({
        id: row.id,
        parentId: row.parent_id,
        content: row.content,
        author: row.role === 'admin' ? '염광사' : '익명',
        isAuthor: user && user.id === row.user_id,
        likeCount: row.like_count,
        alreadyLiked,
        createdAt: row.created_at
      });
    }

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('댓글 목록 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const [banned] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [user.id]);
    if (banned.length > 0 && banned[0].is_banned) {
      return NextResponse.json({ error: '이용이 제한된 계정입니다' }, { status: 403 });
    }

    const { postId, parentId, content } = await request.json();

    if (!postId || !content) {
      return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 });
    }

    const hasBanned = await containsBannedWord(content);
    if (hasBanned) {
      return NextResponse.json({ error: '부적절한 표현이 포함되어 있습니다' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [postId, user.id, parentId || null, content]
    );

    await pool.query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);

    return NextResponse.json({ message: '댓글 작성 완료' }, { status: 201 });

  } catch (error) {
    console.error('댓글 작성 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
