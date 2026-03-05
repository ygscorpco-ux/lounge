'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/login');
    } else {
      setError(data.error || '가입 실패');
    }
  }

  return (
    <div className='auth-page' style={{ position: 'relative' }}>
      <button onClick={() => router.back()} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div className='auth-logo'>라운지</div>
      <div style={{ fontSize: '14px', color: '#888', marginTop: '-28px', marginBottom: '32px', textAlign: 'center', lineHeight: 1.6 }}>
        간단한 닉네임과 비밀번호만으로<br/>
        <span style={{ fontSize: '13px', color: '#aaa' }}>바로 시작할 수 있어요</span>
      </div>
      <form className='auth-form' onSubmit={handleSubmit}>
        {error && <div className='auth-error'>{error}</div>}
        <input
          className='auth-input'
          type='text'
          placeholder='닉네임 (2~20자)'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className='auth-input'
          type='password'
          placeholder='비밀번호 (4자 이상)'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className='auth-btn' type='submit'>회원가입</button>
        <div className='auth-link'>
          <a href='/login'>이미 계정이 있으신가요? 로그인</a>
        </div>
      </form>
    </div>
  );
}
