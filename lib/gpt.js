import pool from './db.js';

// GPT 호출 공통 유틸
// - 캐시 먼저 확인 → 없으면 OpenAI 호출 → 결과 캐시 저장 + 사용량 기록
// - 에러 발생 시 null 반환 (앱이 절대 깨지지 않게)

const MODEL       = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// 토큰당 비용 (2025년 기준 gpt-4o-mini)
const COST_INPUT  = 0.150 / 1_000_000;  // $0.150 / 1M tokens
const COST_OUTPUT = 0.600 / 1_000_000;  // $0.600 / 1M tokens

/**
 * GPT 호출 함수
 * @param {string} systemPrompt  - AI 역할/행동 지침
 * @param {string} userPrompt    - 실제 분석 요청 내용
 * @param {object} options
 *   - maxTokens  {number}  응답 최대 토큰 (기본 500)
 *   - temperature {number} 창의성 0~1 (기본 0.7)
 *   - cacheKey   {string|null} 캐시 키 (null이면 캐시 안씀)
 *   - feature    {string}  기능명 기록용 (기본 'unknown')
 *   - userId     {number|null} 사용자 ID
 * @returns {{ text: string, cached: boolean } | null}
 */
export async function callGPT(systemPrompt, userPrompt, options = {}) {
  const {
    maxTokens   = 500,
    temperature = 0.7,
    cacheKey    = null,
    feature     = 'unknown',
    userId      = null,
  } = options;

  try {
    // 1. 캐시 조회 — cacheKey가 있고 만료되지 않았으면 캐시 반환
    if (cacheKey) {
      const [cached] = await pool.query(
        `SELECT response_text FROM gpt_cache
         WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > NOW())
         LIMIT 1`,
        [cacheKey]
      );
      if (cached.length > 0) {
        return { text: cached[0].response_text, cached: true };
      }
    }

    // 2. OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[gpt.js] OPENAI_API_KEY가 설정되지 않았습니다');
      return null;
    }

    // 3. OpenAI API 호출 (fetch 사용 — 외부 패키지 의존 최소화)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens:  maxTokens,
        temperature: temperature,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[gpt.js] API 에러:', res.status, errBody);
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim() || '';
    const promptTokens     = json.usage?.prompt_tokens     || 0;
    const completionTokens = json.usage?.completion_tokens || 0;
    const estimatedCost    = promptTokens * COST_INPUT + completionTokens * COST_OUTPUT;

    // 4. 캐시 저장 — 24시간 유효
    if (cacheKey && text) {
      await pool.query(
        `INSERT INTO gpt_cache (cache_key, feature, response_text, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
         ON DUPLICATE KEY UPDATE
           response_text = VALUES(response_text),
           created_at    = NOW(),
           expires_at    = VALUES(expires_at)`,
        [cacheKey, feature, text]
      ).catch(e => console.warn('[gpt.js] 캐시 저장 실패:', e.message));
    }

    // 5. 사용량 로그 기록
    await pool.query(
      `INSERT INTO gpt_usage_log
       (user_id, feature, prompt_tokens, completion_tokens, estimated_cost)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, feature, promptTokens, completionTokens, estimatedCost]
    ).catch(e => console.warn('[gpt.js] 사용량 로그 저장 실패:', e.message));

    return { text, cached: false };

  } catch (err) {
    // 에러 발생해도 null 반환으로 앱 보호
    console.error('[gpt.js] callGPT 에러:', err.message);
    return null;
  }
}

/**
 * 간단한 캐시 키 생성 헬퍼 — 입력 객체를 문자열로 해시
 * @param {string} prefix  - 기능 구분 prefix (예: 'margin', 'labor')
 * @param {object} data    - 입력값 객체
 * @returns {string}
 */
export function makeCacheKey(prefix, data) {
  const str = prefix + ':' + JSON.stringify(data, Object.keys(data).sort());
  // 간단한 djb2 해시 (외부 라이브러리 불필요)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return prefix + '_' + (hash >>> 0).toString(16);
}
