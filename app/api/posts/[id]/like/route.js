import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, user.id]);
      await pool.query('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [id]);
      return NextResponse.json({ message: '추천 취소', liked: false });
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, user.id]);
      await pool.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [id]);
      return NextResponse.json({ message: '추천 완료', liked: true });
    }

  } catch (error) {
    console.error('추천 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}