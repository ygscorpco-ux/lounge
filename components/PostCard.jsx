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

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#a0aec0"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
);

export default function PostCard({ post }) {
  const router = useRouter();
  const isAdmin = post.author === '염광사';

  return (
    <div className='post-card' onClick={() => router.push('/post/' + post.id)}>
      <div className='post-card-top'>
        <div className={'post-card-avatar' + (isAdmin ? ' admin' : '')}>
          <PersonIcon />
        </div>
        <div className='post-card-info'>
          <span className='post-card-author'>{post.author}</span>
          <span className='post-card-date'>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      {post.isNotice && <div className='post-card-badge'><span className='notice-tag'>공지</span></div>}
      <div className='post-card-title'>{post.title}</div>
      <div className='post-card-content'>{post.content}</div>
      <div className='post-card-footer'>
        <span className='post-card-stat like'>
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          {post.likeCount}
        </span>
        <span className='post-card-stat comment'>
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
          {post.commentCount}
        </span>
      </div>
    </div>
  );
}
