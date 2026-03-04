'use client';
import { useState } from 'react';

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

export default function CommentItem({ comment, onLike, onReport, onReply, onDelete, onBlock }) {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = comment.author === '염광사';

  return (
    <div className={comment.parentId ? 'comment-item comment-reply' : 'comment-item'} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={'comment-author' + (isAdmin ? ' admin' : '')}>
          {comment.author}
        </div>
        <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', color: '#999', fontSize: '14px', cursor: 'pointer', padding: '4px' }}>⋮</button>
        {showMenu && (
          <div style={{
            position: 'absolute', top: '28px', right: '8px', background: 'white',
            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0', zIndex: 100, minWidth: '100px'
          }}>
            {(comment.isAuthor || comment.isAdmin) && (
              <div onClick={() => { onDelete(comment.id); setShowMenu(false); }} style={{ padding: '8px 14px', fontSize: '13px', color: '#ff3b30', cursor: 'pointer' }}>삭제</div>
            )}
            <div onClick={() => { onReport(comment.id); setShowMenu(false); }} style={{ padding: '8px 14px', fontSize: '13px', color: '#333', cursor: 'pointer' }}>신고</div>
            {!comment.isAuthor && comment.userId && (
              <div onClick={() => { onBlock(comment.userId); setShowMenu(false); }} style={{ padding: '8px 14px', fontSize: '13px', color: '#333', cursor: 'pointer' }}>차단</div>
            )}
          </div>
        )}
      </div>
      <div className='comment-content'>{comment.content}</div>
      <div className='comment-footer'>
        <span>{timeAgo(comment.createdAt)}</span>
        <span
          style={{ cursor: 'pointer', color: comment.alreadyLiked ? '#1b4797' : '#aaa' }}
          onClick={() => onLike(comment.id)}
        >
          &#x2764; {comment.likeCount}
        </span>
        {!comment.parentId && (
          <span style={{ cursor: 'pointer', color: '#1b4797' }} onClick={() => onReply(comment.id)}>
            답글
          </span>
        )}
      </div>
    </div>
  );
}
