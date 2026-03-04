'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CommentItem from '../../../components/CommentItem.jsx';

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

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchPost() {
    const res = await fetch('/api/posts/' + id);
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
    }
    setLoading(false);
  }

  async function fetchComments() {
    const res = await fetch('/api/comments?postId=' + id);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
  }

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  async function handleLikePost() {
    const res = await fetch('/api/posts/' + id + '/like', { method: 'POST' });
    if (res.ok) fetchPost();
  }

  async function handleDeletePost() {
    if (!confirm('이 글을 삭제하시겠습니까?')) return;
    const res = await fetch('/api/posts/' + id, { method: 'DELETE' });
    if (res.ok) router.push('/');
  }

  async function handleReport() {
    const res = await fetch('/api/posts/' + id + '/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '부적절한 내용' })
    });
    if (res.ok) alert('신고 완료');
  }

  async function handleCommentSubmit() {
    if (!commentText.trim()) return;

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: parseInt(id),
        parentId: replyTo,
        content: commentText
      })
    });

    if (res.ok) {
      setCommentText('');
      setReplyTo(null);
      fetchComments();
      fetchPost();
    }
  }

  async function handleCommentLike(commentId) {
    const res = await fetch('/api/comments/' + commentId + '/like', { method: 'POST' });
    if (res.ok) fetchComments();
  }

  async function handleCommentReport(commentId) {
    const res = await fetch('/api/comments/' + commentId + '/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '부적절한 내용' })
    });
    if (res.ok) alert('신고 완료');
  }

  if (loading) return <div className='loading'>로딩 중...</div>;
  if (!post) return <div className='empty'>글을 찾을 수 없습니다</div>;

  const parentComments = comments.filter(c => !c.parentId);
  const childComments = comments.filter(c => c.parentId);

  return (
    <div className='post-detail'>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className='back-btn' onClick={() => router.push('/')}>&#x2190;</button>
        <span style={{ color: 'white', fontWeight: 600 }}>게시글</span>
      </div>

      <div className='post-detail-header'>
        <div className='post-detail-category'>{post.category}</div>
        <div className='post-detail-title'>{post.title}</div>
        <div className='post-detail-meta'>
          <span>{post.author} &middot; {timeAgo(post.createdAt)}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(post.isAuthor || post.isAdmin) && (
              <span className='delete-btn' onClick={handleDeletePost}>삭제</span>
            )}
            <span className='report-btn' onClick={handleReport}>신고</span>
          </div>
        </div>
      </div>

      <div className='post-detail-content'>{post.content}</div>

      <div className='post-detail-actions'>
        <button
          className={'action-btn' + (post.alreadyLiked ? ' liked' : '')}
          onClick={handleLikePost}
        >
          &#x2764; {post.likeCount}
        </button>
        <button className='action-btn'>
          &#x1F4AC; {post.commentCount}
        </button>
      </div>

      <div className='comment-section' style={{ paddingBottom: '80px' }}>
        <div className='comment-count'>댓글 {comments.length}</div>
        {parentComments.map(comment => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              onLike={handleCommentLike}
              onReport={handleCommentReport}
              onReply={(id) => setReplyTo(id)}
            />
            {childComments
              .filter(c => c.parentId === comment.id)
              .map(child => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  onLike={handleCommentLike}
                  onReport={handleCommentReport}
                  onReply={() => {}}
                />
              ))}
          </div>
        ))}
        {comments.length === 0 && <div className='empty'>댓글이 없습니다</div>}
      </div>

      <div className='comment-input-wrap'>
        <input
          className='comment-input'
          type='text'
          placeholder={replyTo ? '답글 작성...' : '댓글 작성...'}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
        />
        <button className='comment-submit' onClick={handleCommentSubmit}>등록</button>
      </div>
    </div>
  );
}
