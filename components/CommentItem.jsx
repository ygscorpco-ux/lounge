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

const PersonIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#a0aec0"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
);

export default function CommentItem({ comment, onLike, onReport, onReply, onDelete, onBlock }) {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = comment.author === '염광사';

  return (
    <div className={comment.parentId ? 'comment-item comment-reply' : 'comment-item'}>
      <div className='comment-top'>
        <div className='comment-author-row'>
          <div className={'comment-avatar' + (isAdmin ? ' admin' : '')}>
            <PersonIcon />
          </div>
          <span className={'comment-author' + (isAdmin ? ' admin' : '')}>{comment.author}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button className='comment-menu-btn' onClick={() => setShowMenu(!showMenu)}>···</button>
          {showMenu && (
            <div className='dropdown-menu'>
              {(comment.isAuthor || comment.isAdmin) && (
                <div className='dropdown-item danger' onClick={() => { onDelete(comment.id); setShowMenu(false); }}>삭제</div>
              )}
              <div className='dropdown-item' onClick={() => { onReport(comment.id); setShowMenu(false); }}>신고</div>
              {!comment.isAuthor && comment.userId && (
                <div className='dropdown-item' onClick={() => { onBlock(comment.userId); setShowMenu(false); }}>차단</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className='comment-content'>{comment.content}</div>
      <div className='comment-footer'>
        <span>{timeAgo(comment.createdAt)}</span>
        <span className={comment.alreadyLiked ? 'liked' : ''} onClick={() => onLike(comment.id)}>
          ♥ {comment.likeCount}
        </span>
        {!comment.parentId && (
          <span style={{ color: '#1b4797', fontWeight: 600 }} onClick={() => onReply(comment.id)}>
            답글
          </span>
        )}
      </div>
    </div>
  );
}
