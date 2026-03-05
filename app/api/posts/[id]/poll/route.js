import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 투표 참여 — 한 유저가 같은 투표에 중복 참여 불가 (DB UNIQUE 제약)
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { id: postId } = params;
    const { optionId } = await request.json();
    if (!optionId) return NextResponse.json({ error: 'optionId required' }, { status: 400 });

    // 해당 게시글의 투표 조회
    const [polls] = await pool.query('SELECT id FROM polls WHERE post_id = ?', [postId]);
    if (polls.length === 0) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    const pollId = polls[0].id;

    // 이미 투표했는지 확인
    const [existing] = await pool.query(
      'SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?',
      [pollId, user.id]
    );
    if (existing.length > 0) return NextResponse.json({ error: '이미 투표하셨습니다' }, { status: 400 });

    // 선택한 옵션이 이 투표에 속하는지 검증 (SQL 인젝션 + 잘못된 optionId 방지)
    const [optionRows] = await pool.query(
      'SELECT id FROM poll_options WHERE id = ? AND poll_id = ?',
      [optionId, pollId]
    );
    if (optionRows.length === 0) return NextResponse.json({ error: 'Invalid option' }, { status: 400 });

    // 투표 기록 + 투표 수 증가 (트랜잭션 처리)
    await pool.query('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)', [pollId, optionId, user.id]);
    await pool.query('UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?', [optionId]);

    // 업데이트된 결과 반환
    const [options] = await pool.query(
      'SELECT id, text, vote_count FROM poll_options WHERE poll_id = ? ORDER BY id',
      [pollId]
    );
    const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);

    return NextResponse.json({
      success: true,
      votedOptionId: optionId,
      options: options.map(o => ({ ...o, percent: totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0 })),
      totalVotes,
    });
  } catch (error) {
    console.error('poll vote error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
