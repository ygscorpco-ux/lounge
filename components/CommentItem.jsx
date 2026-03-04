'use client';

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

export default function CommentItem({ comment, onLike, onReport, onReply }) {
  const isAdmin = comment.author === '염광사';

  return (
    <div className={comment.parentId ? 'comment-item comment-reply' : 'comment-item'}>
      <div className={'comment-author' + (isAdmin ? ' admin' : '')}>
        {comment.author}
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
          <span style={{ cursor: 'pointer' }} onClick={() => onReply(comment.id)}>
            답글
          </span>
        )}
        <span className='report-btn' onClick={() => onReport(comment.id)}>
          신고
        </span>
      </div>
    </div>
  );
}