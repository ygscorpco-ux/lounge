import { NextResponse } from 'next/server';

// 로그아웃 — 쿠키에서 토큰 삭제
export async function POST() {
  const response = NextResponse.json({ message: '로그아웃 완료' });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,          // 즉시 만료
    path: '/'
  });

  return response;
}
