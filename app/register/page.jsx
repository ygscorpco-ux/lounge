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
    <div className='auth-page'>
      <div className='auth-logo'>라운지</div>
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
