import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { newUsername, currentPassword, newPassword } = await request.json();

    if (newUsername) {
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, user.id]);
      if (existing.length > 0) return NextResponse.json({ error: '이미 사용 중인 닉네임입니다' }, { status: 400 });
      await pool.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, user.id]);
    }

    if (currentPassword && newPassword) {
      const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [user.id]);
      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!valid) return NextResponse.json({ error: '현재 비밀번호가 틀립니다' }, { status: 400 });
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    }

    return NextResponse.json({ message: '수정 완료' });
  } catch (error) {
    console.error('profile update error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
