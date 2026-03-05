'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GptUsagePage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/gpt-usage');
        const data = await res.json();
        if (data.success) setLogs(data.data || []);
        else setError(data.error || '불러오기 실패');
      } catch {
        setError('네트워크 오류');
      }
      setLoading(false);
    }
    load();
  }, []);

  // 요약 집계
  const summary = logs.reduce((acc, log) => {
    acc.totalCalls++;
    acc.totalTokens += (log.prompt_tokens || 0) + (log.completion_tokens || 0);
    acc.totalCost   += parseFloat(log.estimated_cost || 0);
    if (!acc.byFeature[log.feature]) acc.byFeature[log.feature] = { calls: 0, cost: 0 };
    acc.byFeature[log.feature].calls++;
    acc.byFeature[log.feature].cost += parseFloat(log.estimated_cost || 0);
    return acc;
  }, { totalCalls: 0, totalTokens: 0, totalCost: 0, byFeature: {} });

  const featureLabels = {
    'margin-analysis': '마진 분석',
    'labor-analysis': '인건비 분석',
    'subsidy-recommend': '지원금 추천',
    'contract-special-terms': '특약 검토',
    'contract-review': '계약서 검토',
  };

  const maxCalls = Math.max(...Object.values(summary.byFeature).map(f => f.calls), 1);

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700 }}>GPT 사용량 대시보드</span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {error && <div style={{ padding: '12px', background: '#fff0f0', color: '#e74c3c', borderRadius: '10px', marginBottom: '12px', fontSize: '13px' }}>⚠️ {error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>로딩 중...</div>
        ) : (
          <>
            {/* 요약 카드 4개 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: '총 호출수', value: summary.totalCalls.toLocaleString() + '회', icon: '🤖', color: '#1b4797' },
                { label: '총 토큰', value: summary.totalTokens.toLocaleString(), icon: '📊', color: '#7c3aed' },
                { label: '총 비용(USD)', value: '$' + summary.totalCost.toFixed(4), icon: '💵', color: '#e74c3c' },
                { label: '기능 수', value: Object.keys(summary.byFeature).length + '개', icon: '⚙️', color: '#27ae60' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(27,71,151,0.06)', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: item.color, marginBottom: '4px' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* 기능별 바 차트 */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(27,71,151,0.06)', border: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>기능별 사용량</div>
              {Object.entries(summary.byFeature).sort((a, b) => b[1].calls - a[1].calls).map(([feature, stat]) => (
                <div key={feature} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{featureLabels[feature] || feature}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{stat.calls}회 · ${stat.cost.toFixed(4)}</span>
                  </div>
                  {/* CSS only 바 차트 */}
                  <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${(stat.calls / maxCalls) * 100}%`,
                      background: 'linear-gradient(90deg, #1b4797, #4f80e1)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
              {Object.keys(summary.byFeature).length === 0 && (
                <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '10px' }}>아직 GPT 호출 기록이 없습니다</div>
              )}
            </div>

            {/* 최근 로그 테이블 */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(27,71,151,0.06)', border: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>최근 호출 로그</div>
              {logs.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '10px' }}>로그가 없습니다</div>
              ) : logs.slice(0, 30).map((log, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f4f4f4', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#1b4797' }}>{featureLabels[log.feature] || log.feature}</span>
                    <span style={{ color: '#e74c3c', fontWeight: 600 }}>${parseFloat(log.estimated_cost || 0).toFixed(5)}</span>
                  </div>
                  <div style={{ color: '#888' }}>
                    토큰: {log.prompt_tokens}+{log.completion_tokens} · {new Date(log.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
