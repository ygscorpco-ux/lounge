'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(data.error || '로그인 실패');
    }
  }

  return (
    <div className='auth-page' style={{ position: 'relative' }}>
      <button onClick={() => router.push('/')} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span style={{ fontSize: '15px', color: '#333', fontWeight: 500, marginLeft: '4px' }}>돌아가기</span>
      </button>
      <div className='auth-logo'>라운지</div>
      <div style={{ fontSize: '14px', color: '#888', marginTop: '-28px', marginBottom: '32px', textAlign: 'center', lineHeight: 1.6 }}>
        사장님들의 솔직한 이야기 공간<br/>
        <span style={{ fontSize: '13px', color: '#aaa' }}>로그인하고 자유롭게 소통하세요</span>
      </div>
      <form className='auth-form' onSubmit={handleSubmit}>
        {error && <div className='auth-error'>{error}</div>}
        <input
          className='auth-input'
          type='text'
          placeholder='닉네임'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className='auth-input'
          type='password'
          placeholder='비밀번호'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className='auth-btn' type='submit'>로그인</button>
        <div className='auth-link'>
          <a href='/register'>회원가입</a>
        </div>
      </form>
    </div>
  );
}
