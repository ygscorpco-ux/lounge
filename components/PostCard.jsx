'use client';
import { useRouter } from 'next/navigation';

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 172800) return '어제';
  return (date.getMonth() + 1) + '/' + date.getDate();
}

export default function PostCard({ post }) {
  const router = useRouter();

  return (
    <div className='post-card' onClick={() => router.push('/post/' + post.id)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        {post.isNotice && <span style={{ background: '#ff3b30', color: 'white', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px' }}>공지</span>}
        <span className='post-card-category'>{post.category}</span>
      </div>
      <div className='post-card-title'>{post.title}</div>
      <div className='post-card-content'>{post.content}</div>
      <div className='post-card-footer'>
        <span>{post.author} &middot; {timeAgo(post.createdAt)}</span>
        <div className='post-card-stats'>
          <span className='post-card-stat'>&#x2764; {post.likeCount}</span>
          <span className='post-card-stat'>&#x1F4AC; {post.commentCount}</span>
        </div>
      </div>
    </div>
  );
}
