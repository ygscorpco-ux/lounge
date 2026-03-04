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
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  async function checkBookmark() {
    try {
      const res = await fetch('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setBookmarked((data.posts || []).some(p => p.id === parseInt(id)));
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchPost();
    fetchComments();
    checkBookmark();
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
    setShowMenu(false);
  }

  async function handleBookmark() {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: parseInt(id) })
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
    }
  }

  async function handleBlockUser() {
    if (!post) return;
    if (!confirm('이 사용자의 글을 앞으로 숨기시겠습니까?')) return;
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: post.userId })
    });
    if (res.ok) {
      alert('차단 완료. 이 사용자의 글이 숨겨집니다.');
      router.push('/');
    }
    setShowMenu(false);
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다'));
    }
    setShowMenu(false);
  }

  async function handleCommentSubmit() {
    if (!commentText.trim()) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: parseInt(id), parentId: replyTo, content: commentText })
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

  async function handleCommentDelete(commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    const res = await fetch('/api/comments?id=' + commentId, { method: 'DELETE' });
    if (res.ok) {
      fetchComments();
      fetchPost();
    }
  }

  async function handleCommentBlock(userId) {
    if (!confirm('이 사용자의 글을 앞으로 숨기시겠습니까?')) return;
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      alert('차단 완료');
      fetchComments();
    }
  }

  if (loading) return <div className='loading'>로딩 중...</div>;
  if (!post) return <div className='empty'>글을 찾을 수 없습니다</div>;

  const parentComments = comments.filter(c => !c.parentId);
  const childComments = comments.filter(c => c.parentId);

  return (
    <div className='post-detail'>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className='back-btn' onClick={() => router.push('/')}>&#x2190;</button>
          <span style={{ color: 'white', fontWeight: 600 }}>게시글</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
          <button onClick={handleBookmark} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
            {bookmarked ? '★' : '☆'}
          </button>
          <button onClick={handleShare} style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}>
            ↗
          </button>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
            ⋮
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: '30px', right: 0, background: 'white',
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '4px 0', zIndex: 100, minWidth: '120px'
            }}>
              {(post.isAuthor || post.isAdmin) && (
                <div onClick={handleDeletePost} style={{ padding: '10px 16px', fontSize: '14px', color: '#ff3b30', cursor: 'pointer' }}>삭제</div>
              )}
              <div onClick={handleReport} style={{ padding: '10px 16px', fontSize: '14px', color: '#333', cursor: 'pointer' }}>신고</div>
              {!post.isAuthor && (
                <div onClick={handleBlockUser} style={{ padding: '10px 16px', fontSize: '14px', color: '#333', cursor: 'pointer' }}>이 사용자 차단</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='post-detail-header'>
        <div className='post-detail-category'>{post.category}</div>
        <div className='post-detail-title'>{post.title}</div>
        <div className='post-detail-meta'>
          <span>{post.author} &middot; {timeAgo(post.createdAt)}</span>
        </div>
      </div>

      <div className='post-detail-content'>{post.content}</div>

      <div className='post-detail-actions'>
        <button className={'action-btn' + (post.alreadyLiked ? ' liked' : '')} onClick={handleLikePost}>
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
              onReply={(cid) => setReplyTo(cid)}
              onDelete={handleCommentDelete}
              onBlock={handleCommentBlock}
            />
            {childComments.filter(c => c.parentId === comment.id).map(child => (
              <CommentItem
                key={child.id}
                comment={child}
                onLike={handleCommentLike}
                onReport={handleCommentReport}
                onReply={() => {}}
                onDelete={handleCommentDelete}
                onBlock={handleCommentBlock}
              />
            ))}
          </div>
        ))}
        {comments.length === 0 && <div className='empty'>댓글이 없습니다</div>}
      </div>

      <div className='comment-input-wrap'>
        {replyTo && (
          <div style={{ padding: '6px 12px', background: '#f0f4ff', fontSize: '12px', color: '#1b4797', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>답글 작성 중</span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', padding: replyTo ? '0 12px 12px' : '0' }}>
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
    </div>
  );
}
