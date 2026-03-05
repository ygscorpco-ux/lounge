'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDeliveryFeesPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState({ platform_id: 'baemin', tier_label: '', fee_rate: '', payment_fee_rate: '0', delivery_min: '0', delivery_max: '0', packaging_fee: '0', is_default: 0, memo: '' });

  async function loadData() {
    setLoading(true);
    const res = await fetch('/api/delivery-fees?t=' + Date.now());
    const data = await res.json();
    if (data.success) setPlatforms(data.data || []);
    setLoading(false);
  }

  async function loadHistory() {
    const res = await fetch('/api/admin/delivery-fees/history');
    const data = await res.json();
    if (data.success) setHistory(data.data || []);
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(tier) {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/admin/delivery-fees/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (data.success) {
      setMsg('저장됐습니다'); setEditingId(null);
      await loadData();
    } else setMsg(data.error || '저장 실패');
    setSaving(false);
    setTimeout(() => setMsg(''), 2500);
  }

  async function deleteTier(id) {
    if (!confirm('이 구간을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/delivery-fees/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { setMsg('삭제됐습니다'); await loadData(); }
    else setMsg(data.error || '삭제 실패');
    setTimeout(() => setMsg(''), 2500);
  }

  async function addTier() {
    if (!newTier.fee_rate) { setMsg('수수료율을 입력하세요'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/delivery-fees/tier', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTier),
    });
    const data = await res.json();
    if (data.success) {
      setMsg('추가됐습니다'); setShowAddForm(false);
      setNewTier({ platform_id: 'baemin', tier_label: '', fee_rate: '', payment_fee_rate: '0', delivery_min: '0', delivery_max: '0', packaging_fee: '0', is_default: 0, memo: '' });
      await loadData();
    } else setMsg(data.error || '추가 실패');
    setSaving(false);
    setTimeout(() => setMsg(''), 2500);
  }

  const PLATFORMS = ['baemin', 'coupang', 'yogiyo', 'ddangyo'];
  const PLATFORM_NAMES = { baemin: '배달의민족', coupang: '쿠팡이츠', yogiyo: '요기요', ddangyo: '땡겨요' };

  const inputS = { padding: '7px 10px', fontSize: '13px', border: '1.5px solid #ddd', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', width: '100%', background: '#fff' };

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700 }}>수수료 관리</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => { setShowHistory(v => !v); if (!showHistory) loadHistory(); }} style={{
            padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #ddd',
            background: showHistory ? '#1b4797' : '#fff', color: showHistory ? '#fff' : '#333',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>📋 변경이력</button>
          <button onClick={() => setShowAddForm(v => !v)} style={{
            padding: '7px 14px', borderRadius: '8px', border: 'none',
            background: '#1b4797', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>+ 구간 추가</button>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', fontWeight: 600,
            background: msg.includes('실패') || msg.includes('오류') ? '#fff0f0' : '#f0faf4',
            color: msg.includes('실패') || msg.includes('오류') ? '#e74c3c' : '#27ae60' }}>
            {msg}
          </div>
        )}

        {/* 구간 추가 폼 */}
        {showAddForm && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(27,71,151,0.08)', border: '1px solid #eee' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>새 수수료 구간 추가</div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>플랫폼</div>
              <select value={newTier.platform_id} onChange={e => setNewTier(t => ({ ...t, platform_id: e.target.value }))} style={{ ...inputS }}>
                {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_NAMES[p]}</option>)}
              </select>
            </div>
            {[
              { key: 'tier_label', label: '구간명', placeholder: '예) 일반' },
              { key: 'fee_rate', label: '수수료율 (%)*', placeholder: '6.8' },
              { key: 'payment_fee_rate', label: '결제수수료 (%)', placeholder: '1.5' },
              { key: 'delivery_min', label: '배달비 최소 (원)', placeholder: '2100' },
              { key: 'delivery_max', label: '배달비 최대 (원)', placeholder: '3100' },
              { key: 'packaging_fee', label: '포장비율 (%)', placeholder: '6.8' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>{label}</div>
                <input value={newTier[key]} onChange={e => setNewTier(t => ({ ...t, [key]: e.target.value }))} placeholder={placeholder} style={inputS} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #ddd', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>취소</button>
              <button onClick={addTier} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#1b4797', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? '저장 중...' : '추가하기'}
              </button>
            </div>
          </div>
        )}

        {/* 변경이력 */}
        {showHistory && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(27,71,151,0.08)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>📋 최근 변경이력</div>
            {history.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '10px' }}>변경 이력이 없습니다</div>
            ) : history.map((h, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                <div style={{ fontWeight: 600 }}>{h.platform_id} · {h.tier_label}</div>
                <div style={{ color: '#888', marginTop: '2px' }}>
                  {h.field_changed}: {h.value_before}% → <span style={{ color: '#1b4797', fontWeight: 700 }}>{h.value_after}%</span>
                </div>
                <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>
                  {new Date(h.changed_at).toLocaleString('ko-KR')} {h.changed_by_name ? `· ${h.changed_by_name}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 플랫폼별 수수료 카드 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>로딩 중...</div>
        ) : platforms.map(p => (
          <div key={p.platform_id} style={{ background: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(27,71,151,0.08)', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color }} />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{p.name}</span>
            </div>

            {p.tiers.map(tier => (
              <div key={tier.id}>
                {editingId === tier.id ? (
                  // 인라인 편집 모드
                  <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: '2px solid #1b4797' }}>
                    {[
                      { key: 'tier_label', label: '구간명' },
                      { key: 'fee_rate', label: '수수료 (%)' },
                      { key: 'payment_fee_rate', label: '결제수수료 (%)' },
                      { key: 'delivery_min', label: '배달비 최소 (원)' },
                      { key: 'delivery_max', label: '배달비 최대 (원)' },
                      { key: 'packaging_fee', label: '포장비율 (%)' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#666', minWidth: '90px', flexShrink: 0 }}>{label}</span>
                        <input value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inputS, flex: 1 }} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1.5px solid #ddd', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>취소</button>
                      <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#1b4797', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 표시 모드
                  <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px', background: tier.is_default ? '#eef2fb' : '#f8f9fa', border: `1.5px solid ${tier.is_default ? '#b8ccf0' : '#eee'}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{tier.tier_label || '기본'}</span>
                        {tier.is_default === 1 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: '#1b4797', color: '#fff', fontWeight: 700 }}>기본</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                        수수료 <strong style={{ color: '#e74c3c' }}>{tier.fee_rate}%</strong>
                        {tier.payment_fee_rate > 0 && ` + 결제 ${tier.payment_fee_rate}%`}
                        {tier.delivery_min > 0 && ` · 배달 ${tier.delivery_min?.toLocaleString()}~${tier.delivery_max?.toLocaleString()}원`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit(tier)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => deleteTier(tier.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#fff0f0', color: '#e74c3c', fontSize: '12px', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
