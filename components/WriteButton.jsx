'use client';
import { useRouter } from 'next/navigation';

export default function WriteButton() {
  const router = useRouter();

  return (
    <button className='write-btn' onClick={() => router.push('/post/write')}>
      +
    </button>
  );
}
