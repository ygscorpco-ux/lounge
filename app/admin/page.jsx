'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [banUserId, setBanUserId] = useState('');
  const [messageUserId, setMessageUserId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const router = useRouter();

  async function fetchWords() {
    const res = await fetch('/api/admin/words');
    if (res.ok) {
      const data = await res.json();
      setWords(data.words || []);
    }
  }

  useEffect(() => { fetchWords(); }, []);

  async function addWord() {
    if (!newWord.trim()) return;
    await fetch('/api/admin/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord })
    });
    setNewWord('');
    fetchWords();
  }

  async function deleteWord(wordId) {
    await fetch('/api/admin/words', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId })
    });
    fetchWords();
  }

  async function banUser() {
    if (!banUserId) return;
    await fetch('/api/admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(banUserId), ban: true })
    });
    alert('차단 완료');
    setBanUserId('');
  }

  async function sendMessage() {
    if (!messageUserId || !messageContent) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: parseInt(messageUserId), content: messageContent })
    });
    alert('쪽지 전송 완료');
    setMessageUserId('');
    setMessageContent('');
  }

  return (
    <div className='admin-page'>
      <div style={{ background: '#1b4797', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', margin: '-16px -16px 16px' }}>
        <button className='back-btn' onClick={() => router.push('/')}>&#x2190;</button>
        <span style={{ color: 'white', fontWeight: 600 }}>관리자</span>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>금칙어 관리</div>
        <div className='admin-input-row'>
          <input className='admin-input' placeholder='금칙어 추가...' value={newWord} onChange={(e) => setNewWord(e.target.value)} />
          <button className='admin-btn' onClick={addWord}>추가</button>
        </div>
        {words.map(w => (
          <div key={w.id} className='admin-list-item'>
            <span>{w.word}</span>
            <button className='admin-btn admin-btn-danger' onClick={() => deleteWord(w.id)}>삭제</button>
          </div>
        ))}
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>회원 차단</div>
        <div className='admin-input-row'>
          <input className='admin-input' placeholder='회원 ID (숫자)' value={banUserId} onChange={(e) => setBanUserId(e.target.value)} />
          <button className='admin-btn admin-btn-danger' onClick={banUser}>차단</button>
        </div>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>쪽지 보내기</div>
        <div className='admin-input-row'>
          <input className='admin-input' placeholder='회원 ID (숫자)' value={messageUserId} onChange={(e) => setMessageUserId(e.target.value)} />
        </div>
        <div className='admin-input-row'>
          <input className='admin-input' placeholder='쪽지 내용' value={messageContent} onChange={(e) => setMessageContent(e.target.value)} />
          <button className='admin-btn' onClick={sendMessage}>전송</button>
        </div>
      </div>
    </div>
  );
}
