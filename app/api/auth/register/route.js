import pool from '../../../../lib/db.js';
import { hashPassword } from '../../../../lib/utils.js';
import { NextResponse } from 'next/server';

// 회원가입
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

    // 닉네임 길이 체크
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 2~20자로 입력해주세요' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 체크
    if (password.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 4자 이상 입력해주세요' },
        { status: 400 }
      );
    }

    // 닉네임 중복 체크
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다' },
        { status: 409 }
      );
    }

    // 비밀번호 암호화 후 저장
    const hashed = await hashPassword(password);
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hashed, 'user']
    );

    return NextResponse.json({ message: '가입 완료' }, { status: 201 });

  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}