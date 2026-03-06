'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function targetKey(item) {
  return `${item.targetType}:${item.targetId}`;
}

export default function AdminPage() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [banUserId, setBanUserId] = useState('');
  const [messageUserId, setMessageUserId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [reports, setReports] = useState([]);
  const [selectedReportKeys, setSelectedReportKeys] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [processingReports, setProcessingReports] = useState(false);
  const router = useRouter();

  async function fetchWords() {
    try {
      const response = await fetch('/api/admin/words');
      if (!response.ok) return;
      const data = await response.json();
      setWords(data.words || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchReports() {
    setLoadingReports(true);
    try {
      const response = await fetch('/api/admin/reports?t=' + Date.now());
      if (!response.ok) {
        setReports([]);
        return;
      }
      const data = await response.json();
      setReports(data.items || []);
    } catch (error) {
      console.error(error);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    fetchWords();
    fetchReports();
  }, []);

  async function addWord() {
    if (!newWord.trim()) return;
    try {
      await fetch('/api/admin/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newWord.trim() }),
      });
      setNewWord('');
      fetchWords();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteWord(wordId) {
    try {
      await fetch('/api/admin/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      fetchWords();
    } catch (error) {
      console.error(error);
    }
  }

  async function banUser() {
    const userId = Number(banUserId);
    if (!Number.isInteger(userId) || userId <= 0) return;
    try {
      const response = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || '\uCC28\uB2E8 \uC2E4\uD328');
        return;
      }
      alert('\uCC28\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
      setBanUserId('');
    } catch (error) {
      console.error(error);
      alert('\uCC28\uB2E8 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.');
    }
  }

  async function sendMessage() {
    const receiverId = Number(messageUserId);
    if (!Number.isInteger(receiverId) || receiverId <= 0 || !messageContent.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content: messageContent.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || '\uCABD\uC9C0 \uC804\uC1A1 \uC2E4\uD328');
        return;
      }
      alert('\uCABD\uC9C0\uAC00 \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
      setMessageUserId('');
      setMessageContent('');
    } catch (error) {
      console.error(error);
      alert('\uCABD\uC9C0 \uC804\uC1A1 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.');
    }
  }

  function toggleReport(target) {
    const key = targetKey(target);
    setSelectedReportKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  function toggleAllReports(checked) {
    if (!checked) {
      setSelectedReportKeys([]);
      return;
    }
    setSelectedReportKeys(reports.map((item) => targetKey(item)));
  }

  async function processReports(action) {
    if (processingReports) return;

    const selectedItems = reports.filter((item) =>
      selectedReportKeys.includes(targetKey(item)),
    );
    if (selectedItems.length === 0) {
      alert('\uCC98\uB9AC\uD560 \uC2E0\uACE0 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.');
      return;
    }

    setProcessingReports(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          items: selectedItems.map((item) => ({
            targetType: item.targetType,
            targetId: item.targetId,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || '\uC77C\uAD04 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
        return;
      }

      alert(
        `\uCC98\uB9AC\uC644\uB8CC: \uB300\uC0C1 ${data.processedTargets || 0}\uAC1C, ` +
          `\uC228\uAE40 ${data.hiddenTargets || 0}\uAC1C, ` +
          `\uCC28\uB2E8 ${data.bannedUsers || 0}\uBA85`,
      );
      setSelectedReportKeys([]);
      await fetchReports();
    } catch (error) {
      console.error(error);
      alert('\uC77C\uAD04 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.');
    } finally {
      setProcessingReports(false);
    }
  }

  const allSelected = reports.length > 0 && selectedReportKeys.length === reports.length;

  return (
    <div className='admin-page'>
      <div className='top-bar'>
        <button className='top-bar-back' onClick={() => router.push('/')}>
          <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='#333' strokeWidth='2' strokeLinecap='round'>
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </button>
        <span className='top-bar-title'>{'\uAD00\uB9AC\uC790'}</span>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>{'\uBAA8\uB2C8\uD130\uB9C1'}</div>
        <div className='admin-input-row'>
          <button className='admin-btn' onClick={() => router.push('/admin/monitoring')}>
            {'\uBAA8\uB2C8\uD130\uB9C1 \uB300\uC2DC\uBCF4\uB4DC \uC5F4\uAE30'}
          </button>
        </div>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>{'\uC2E0\uACE0 \uC77C\uAD04 \uCC98\uB9AC'}</div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input
              type='checkbox'
              checked={allSelected}
              onChange={(event) => toggleAllReports(event.target.checked)}
            />
            <span>{'\uC804\uCCB4\uC120\uD0DD'}</span>
          </label>
          <button className='admin-btn' onClick={fetchReports} disabled={loadingReports || processingReports}>
            {'\uC0C8\uB85C\uACE0\uCE68'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            className='admin-btn'
            onClick={() => processReports('hide')}
            disabled={processingReports || loadingReports}
          >
            {'\uC120\uD0DD \uC228\uAE40'}
          </button>
          <button
            className='admin-btn'
            onClick={() => processReports('block')}
            disabled={processingReports || loadingReports}
          >
            {'\uC120\uD0DD \uCC28\uB2E8'}
          </button>
          <button
            className='admin-btn'
            onClick={() => processReports('hide_and_block')}
            disabled={processingReports || loadingReports}
          >
            {'\uC228\uAE40+\uCC28\uB2E8'}
          </button>
          <button
            className='admin-btn admin-btn-danger'
            onClick={() => processReports('dismiss')}
            disabled={processingReports || loadingReports}
          >
            {'\uC120\uD0DD \uAE30\uAC01'}
          </button>
        </div>

        {loadingReports && <div className='loading'>{'\uBD88\uB7EC\uC624\uB294 \uC911...'}</div>}

        {!loadingReports && reports.length === 0 && (
          <div className='empty' style={{ padding: '14px 0 6px' }}>
            {'\uB204\uC801\uB41C \uC2E0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.'}
          </div>
        )}

        {!loadingReports &&
          reports.map((item) => {
            const key = targetKey(item);
            const selected = selectedReportKeys.includes(key);
            const targetLabel = item.targetType === 'comment' ? '\uB313\uAE00' : '\uAC8C\uC2DC\uAE00';

            return (
              <label
                key={key}
                className='admin-list-item'
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px 1fr',
                  alignItems: 'start',
                  gap: 8,
                }}
              >
                <input
                  type='checkbox'
                  checked={selected}
                  onChange={() => toggleReport(item)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#4d5d74',
                        background: '#eef2f8',
                        borderRadius: 999,
                        padding: '2px 8px',
                      }}
                    >
                      {targetLabel}
                    </span>
                    <span style={{ fontSize: 12, color: '#6e7b8f' }}>{`ID ${item.targetId}`}</span>
                    <span style={{ fontSize: 12, color: '#1b4797', fontWeight: 700 }}>
                      {`\uC2E0\uACE0 ${item.reportCount}`}
                    </span>
                    {item.targetHidden && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#8d95a1',
                          background: '#f1f3f6',
                          borderRadius: 999,
                          padding: '2px 7px',
                        }}
                      >
                        {'\uC228\uAE40'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: '#1f2630', fontWeight: 600, marginBottom: 4 }}>
                    {(item.targetPreview || '').substring(0, 120) || '\uB0B4\uC6A9 \uC5C6\uC74C'}
                  </div>

                  <div style={{ fontSize: 12, color: '#8d96a5', lineHeight: 1.4 }}>
                    {item.reasons && item.reasons.length > 0
                      ? item.reasons.join(' / ')
                      : '\uC2E0\uACE0 \uC0AC\uC720 \uC5C6\uC74C'}
                  </div>
                </div>
              </label>
            );
          })}
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>{'\uAE08\uCE59\uC5B4 \uAD00\uB9AC'}</div>
        <div className='admin-input-row'>
          <input
            className='admin-input'
            placeholder='\uAE08\uCE59\uC5B4 \uCD94\uAC00'
            value={newWord}
            onChange={(event) => setNewWord(event.target.value)}
          />
          <button className='admin-btn' onClick={addWord}>
            {'\uCD94\uAC00'}
          </button>
        </div>
        {words.map((word) => (
          <div key={word.id} className='admin-list-item'>
            <span>{word.word}</span>
            <button className='admin-btn admin-btn-danger' onClick={() => deleteWord(word.id)}>
              {'\uC0AD\uC81C'}
            </button>
          </div>
        ))}
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>{'\uD68C\uC6D0 \uCC28\uB2E8'}</div>
        <div className='admin-input-row'>
          <input
            className='admin-input'
            placeholder='\uD68C\uC6D0 ID (\uC22B\uC790)'
            value={banUserId}
            onChange={(event) => setBanUserId(event.target.value)}
          />
          <button className='admin-btn admin-btn-danger' onClick={banUser}>
            {'\uCC28\uB2E8'}
          </button>
        </div>
      </div>

      <div className='admin-section'>
        <div className='admin-section-title'>{'\uCABD\uC9C0 \uBC1C\uC1A1'}</div>
        <div className='admin-input-row'>
          <input
            className='admin-input'
            placeholder='\uD68C\uC6D0 ID (\uC22B\uC790)'
            value={messageUserId}
            onChange={(event) => setMessageUserId(event.target.value)}
          />
        </div>
        <div className='admin-input-row'>
          <input
            className='admin-input'
            placeholder='\uCABD\uC9C0 \uB0B4\uC6A9'
            value={messageContent}
            onChange={(event) => setMessageContent(event.target.value)}
          />
          <button className='admin-btn' onClick={sendMessage}>
            {'\uC804\uC1A1'}
          </button>
        </div>
      </div>
    </div>
  );
}
