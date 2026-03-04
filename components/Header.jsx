'use client';
import { useRouter } from 'next/navigation';

export default function Header({ user }) {
  const router = useRouter();

  return (
    <header className='header'>
      <div className='header-logo' onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        라운지
      </div>
      <div className='header-icons'>
        <button className='header-icon' onClick={() => router.push('/')}>
          &#x1F50D;
        </button>
        <button className='header-icon' onClick={() => router.push('/mypage')}>
          &#x1F464;
        </button>
      </div>
    </header>
  );
}