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

  async function fetchWords() { const r = await fetch('/api/admin/words'); if (r.ok) { const d = await r.json(); setWords(d.words || []); } }
  useEffect(() => { fetchWords(); }, []);

  async function addWord() { if (!newWord.trim()) return; await fetch('/api/admin/words', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: newWord }) }); setNewWord(''); fetchWords(); }
  async function deleteWord(wid) { await fetch('/api/admin/words', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordId: wid }) }); fetchWords(); }
  async function banUser() { if (!banUserId) return; await fetch('/api/admin/ban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: parseInt(banUserId), ban: true }) }); alert('차단 완료'); setBanUserId(''); }
  async function sendMessage() { if (!messageUserId || !messageContent) return; await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: parseInt(messageUserId), content: messageContent }) }); alert('쪽지 전송 완료'); setMessageUserId(''); setMessageContent(''); }

  return (
    <div className='admin-page'>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.push('/')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className='top-bar-title'>관리자</span>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>금칙어 관리</div>
        <div className='admin-input-row'><input className='admin-input' placeholder='금칙어 추가...' value={newWord} onChange={(e) => setNewWord(e.target.value)} /><button className='admin-btn' onClick={addWord}>추가</button></div>
        {words.map(w => (<div key={w.id} className='admin-list-item'><span>{w.word}</span><button className='admin-btn admin-btn-danger' onClick={() => deleteWord(w.id)}>삭제</button></div>))}
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>회원 차단</div>
        <div className='admin-input-row'><input className='admin-input' placeholder='회원 ID (숫자)' value={banUserId} onChange={(e) => setBanUserId(e.target.value)} /><button className='admin-btn admin-btn-danger' onClick={banUser}>차단</button></div>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>쪽지 보내기</div>
        <div className='admin-input-row'><input className='admin-input' placeholder='회원 ID (숫자)' value={messageUserId} onChange={(e) => setMessageUserId(e.target.value)} /></div>
        <div className='admin-input-row'><input className='admin-input' placeholder='쪽지 내용' value={messageContent} onChange={(e) => setMessageContent(e.target.value)} /><button className='admin-btn' onClick={sendMessage}>전송</button></div>
      </div>
    </div>
  );
}
