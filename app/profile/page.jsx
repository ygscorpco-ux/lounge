'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleUsernameChange() { if (!newUsername.trim()) return; setMessage(''); setError(''); const r = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newUsername }) }); const d = await r.json(); if (r.ok) { setMessage('닉네임이 변경되었습니다'); setNewUsername(''); } else setError(d.error); }
  async function handlePasswordChange() { if (!currentPassword || !newPassword) return; setMessage(''); setError(''); const r = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }); const d = await r.json(); if (r.ok) { setMessage('비밀번호가 변경되었습니다'); setCurrentPassword(''); setNewPassword(''); } else setError(d.error); }

  return (
    <div>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>프로필 수정</span>
      </div>

      {message && <div style={{ padding: '12px 16px', background: '#e8f5e9', color: '#2e7d32', fontSize: '14px' }}>{message}</div>}
      {error && <div className='auth-error' style={{ margin: '12px 16px' }}>{error}</div>}

      <div style={{ padding: '24px 16px', borderBottom: '8px solid #f5f5f5' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>닉네임 변경</h3>
        <input className='auth-input' type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="새 닉네임" />
        <button className='auth-btn' onClick={handleUsernameChange}>변경</button>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>비밀번호 변경</h3>
        <input className='auth-input' type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" />
        <input className='auth-input' type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호" />
        <button className='auth-btn' onClick={handlePasswordChange}>변경</button>
      </div>
    </div>
  );
}
