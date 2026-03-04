import pool from '../../../../lib/db.js';
import { verifyPassword } from '../../../../lib/utils.js';
import { createToken } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 로그인
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // 빈값 체크
    if (!username || !password) {
      return NextResponse.json(
        { error: '닉네임과 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 유저 찾기
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, role, is_banned FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '닉네임 또는 비밀번호가 틀렸습니다' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 차단된 유저 체크
    if (user.is_banned) {
      return NextResponse.json(
        { error: '이용이 제한된 계정입니다' },
        { status: 403 }
      );
    }

    // 비밀번호 확인
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: '닉네임 또는 비밀번호가 틀렸습니다' },
        { status: 401 }
      );
    }

    // 토큰 생성 + 쿠키에 저장
    const token = await createToken(user);
    const response = NextResponse.json({
      message: '로그인 성공',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,       // JS에서 쿠키 접근 불가 (보안)
      secure: false,        // 나중에 https 적용하면 true로 변경
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,  // 7일
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}