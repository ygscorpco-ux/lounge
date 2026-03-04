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

  async function handleUsernameChange() {
    if (!newUsername.trim()) return;
    setMessage(''); setError('');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername })
    });
    const data = await res.json();
    if (res.ok) { setMessage('닉네임이 변경되었습니다'); setNewUsername(''); }
    else setError(data.error);
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword) return;
    setMessage(''); setError('');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) { setMessage('비밀번호가 변경되었습니다'); setCurrentPassword(''); setNewPassword(''); }
    else setError(data.error);
  }

  return (
    <div>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>프로필 수정</span>
      </div>

      {message && <div style={{ padding: '12px 16px', background: '#e8f5e9', color: '#2e7d32', fontSize: '14px' }}>{message}</div>}
      {error && <div style={{ padding: '12px 16px', background: '#ffebee', color: '#c62828', fontSize: '14px' }}>{error}</div>}

      <div style={{ padding: '20px 16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>닉네임 변경</h3>
        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="새 닉네임" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }} />
        <button onClick={handleUsernameChange} style={{ width: '100%', padding: '12px', background: '#1b4797', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>변경</button>
      </div>

      <div style={{ height: '8px', background: '#f0f1f3' }}></div>

      <div style={{ padding: '20px 16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>비밀번호 변경</h3>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }} />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }} />
        <button onClick={handlePasswordChange} style={{ width: '100%', padding: '12px', background: '#1b4797', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>변경</button>
      </div>
    </div>
  );
}
