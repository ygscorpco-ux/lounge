import pool from './db.js';

const MODEL       = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const COST_INPUT  = 0.150 / 1_000_000;
const COST_OUTPUT = 0.600 / 1_000_000;

// 마지막 에러 메시지를 모듈 레벨에서 추적 (API route에서 접근 가능)
let _lastError = '';
export function getLastError() { return _lastError; }

/**
 * callGPT — OpenAI API 호출 공통 유틸
 * 에러 발생 시 null 반환 (앱이 절대 깨지지 않게), _lastError에 원인 저장
 */
export async function callGPT(systemPrompt, userPrompt, options = {}) {
  const {
    maxTokens   = 500,
    temperature = 0.7,
    cacheKey    = null,
    feature     = 'unknown',
    userId      = null,
  } = options;

  _lastError = '';

  try {
    // 1. 캐시 조회
    if (cacheKey) {
      const [cached] = await pool.query(
        `SELECT response_text FROM gpt_cache WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1`,
        [cacheKey]
      );
      if (cached.length > 0) return { text: cached[0].response_text, cached: true };
    }

    // 2. API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      _lastError = 'AI 서비스 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.';
      console.warn('[gpt.js] OPENAI_API_KEY 미설정');
      return null;
    }

    // 3. OpenAI API 호출
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[gpt.js] API 에러:', res.status, errBody);

      // 에러 타입별 친절한 메시지
      if (res.status === 401) {
        _lastError = 'API 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      } else if (res.status === 429) {
        _lastError = 'AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (res.status === 503 || res.status >= 500) {
        _lastError = 'AI 서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.';
      } else {
        _lastError = `AI 분석을 사용할 수 없습니다. (오류 ${res.status})`;
      }
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim() || '';
    const promptTokens     = json.usage?.prompt_tokens     || 0;
    const completionTokens = json.usage?.completion_tokens || 0;
    const estimatedCost    = promptTokens * COST_INPUT + completionTokens * COST_OUTPUT;

    // 4. 캐시 저장 (24시간)
    if (cacheKey && text) {
      await pool.query(
        `INSERT INTO gpt_cache (cache_key, feature, response_text, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR)) ON DUPLICATE KEY UPDATE response_text=VALUES(response_text), created_at=NOW(), expires_at=VALUES(expires_at)`,
        [cacheKey, feature, text]
      ).catch(e => console.warn('[gpt.js] 캐시 저장 실패:', e.message));
    }

    // 5. 사용량 로그
    await pool.query(
      `INSERT INTO gpt_usage_log (user_id, feature, prompt_tokens, completion_tokens, estimated_cost) VALUES (?, ?, ?, ?, ?)`,
      [userId, feature, promptTokens, completionTokens, estimatedCost]
    ).catch(e => console.warn('[gpt.js] 사용량 로그 실패:', e.message));

    return { text, cached: false };

  } catch (err) {
    console.error('[gpt.js] callGPT 예외:', err.message);
    // 네트워크 오류 vs 일반 오류 구분
    if (err.message?.includes('fetch') || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      _lastError = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
    } else {
      _lastError = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    return null;
  }
}

/** 캐시 키 생성 헬퍼 (djb2 해시) */
export function makeCacheKey(prefix, data) {
  const str = prefix + ':' + JSON.stringify(data, Object.keys(data).sort());
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  return prefix + '_' + (hash >>> 0).toString(16);
}
