export const dynamic = 'force-dynamic';
export const revalidate = 0;
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
    const sort = searchParams.get('sort') || 'latest';
    const offset = (page - 1) * PAGE_SIZE;

    const user = await getCurrentUser();
    let blockedIds = [];
    if (user) {
      const [blocks] = await pool.query('SELECT blocked_user_id FROM user_blocks WHERE user_id = ?', [user.id]);
      blockedIds = blocks.map(b => b.blocked_user_id);
    }

    let query = `SELECT p.id, p.user_id, p.category, p.title, p.content, p.is_notice, p.like_count, p.comment_count, p.created_at, u.role 
    FROM posts p JOIN users u ON p.user_id = u.id 
    WHERE p.is_hidden = FALSE`;
    const params = [];

    if (blockedIds.length > 0) {
      query += ' AND p.user_id NOT IN (' + blockedIds.map(() => '?').join(',') + ')';
      params.push(...blockedIds);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (sort === 'likes') {
      query += ' ORDER BY p.is_notice DESC, p.like_count DESC, p.created_at DESC';
    } else if (sort === 'comments') {
      query += ' ORDER BY p.is_notice DESC, p.comment_count DESC, p.created_at DESC';
    } else {
      query += ' ORDER BY p.is_notice DESC, p.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(PAGE_SIZE, offset);

    const [rows] = await pool.query(query, params);

    const posts = rows.map(row => ({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content.substring(0, 100),
      author: row.role === 'admin' ? '염광사' : '익명',
      isNotice: row.is_notice === 1,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at
    }));

    return NextResponse.json({ posts, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error('posts list error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const [banned] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [user.id]);
    if (banned.length > 0 && banned[0].is_banned) return NextResponse.json({ error: 'Account restricted' }, { status: 403 });

    const { category, title, content, isNotice, images, poll } = await request.json();
    if (!category || !title || !content) return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    const hasBanned = await containsBannedWord(title + ' ' + content);
    if (hasBanned) return NextResponse.json({ error: 'Inappropriate content detected' }, { status: 400 });

    if (category === '염광사' && user.role !== 'admin') return NextResponse.json({ error: 'Admin only category' }, { status: 403 });

    const notice = (isNotice && user.role === 'admin') ? true : false;

    // 이미지 URL 배열을 JSON 문자열로 저장 (최대 4장)
    const imagesJson = (Array.isArray(images) && images.length > 0)
      ? JSON.stringify(images.slice(0, 4))
      : null;

    // 투표 유효성 검사 — 질문 + 옵션 2개 이상 있어야 함
    const validPoll = poll && poll.question && poll.question.trim() &&
      Array.isArray(poll.options) &&
      poll.options.filter(o => o && o.trim()).length >= 2;

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, category, title, content, is_notice, images, has_poll) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, category, title, content, notice, imagesJson, validPoll ? true : false]
    );

    const postId = result.insertId;

    // 투표 데이터 저장
    if (validPoll) {
      const [pollResult] = await pool.query(
        'INSERT INTO polls (post_id, question) VALUES (?, ?)',
        [postId, poll.question.trim()]
      );
      const pollId = pollResult.insertId;
      const validOptions = poll.options.filter(o => o && o.trim());
      for (const optionText of validOptions) {
        await pool.query('INSERT INTO poll_options (poll_id, text) VALUES (?, ?)', [pollId, optionText.trim()]);
      }
    }

    return NextResponse.json({ message: 'Posted', postId }, { status: 201 });
  } catch (error) {
    console.error('create post error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
