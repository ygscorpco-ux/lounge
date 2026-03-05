import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 관리자 전용 DB 마이그레이션 — 이미지/투표 기능 테이블 추가
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const results = [];

    // posts 테이블에 images 컬럼 추가 (JSON 배열로 이미지 URL 저장)
    try {
      await pool.query(`ALTER TABLE posts ADD COLUMN images TEXT DEFAULT NULL`);
      results.push('✅ posts.images 컬럼 추가');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') results.push('⏭️ posts.images 이미 존재');
      else throw e;
    }

    // posts 테이블에 has_poll 컬럼 추가
    try {
      await pool.query(`ALTER TABLE posts ADD COLUMN has_poll BOOLEAN DEFAULT FALSE`);
      results.push('✅ posts.has_poll 컬럼 추가');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') results.push('⏭️ posts.has_poll 이미 존재');
      else throw e;
    }

    // polls 테이블 생성 — 게시글당 투표 1개
    await pool.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        question VARCHAR(200) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_id (post_id)
      )
    `);
    results.push('✅ polls 테이블 생성');

    // poll_options 테이블 생성 — 투표 항목들
    await pool.query(`
      CREATE TABLE IF NOT EXISTS poll_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        poll_id INT NOT NULL,
        text VARCHAR(100) NOT NULL,
        vote_count INT DEFAULT 0,
        INDEX idx_poll_id (poll_id)
      )
    `);
    results.push('✅ poll_options 테이블 생성');

    // poll_votes 테이블 생성 — 유저당 1번만 투표 가능 (UNIQUE 제약)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS poll_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        poll_id INT NOT NULL,
        option_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (poll_id, user_id),
        INDEX idx_poll_id (poll_id)
      )
    `);
    results.push('✅ poll_votes 테이블 생성');

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
