import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { callGPT, makeCacheKey, getLastError } from '../../../../lib/gpt.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { specialTerms } = await request.json();
    if (!specialTerms || specialTerms.trim().length < 5) {
      return NextResponse.json({ success: false, error: '특약 내용을 입력해주세요' }, { status: 400 });
    }

    // DB에서 위험 키워드 목록 조회
    const [keywords] = await pool.query(
      'SELECT keyword, risk_level, law_reference, safe_alternative FROM labor_risk_keywords'
    );

    const keywordList = keywords.map(k =>
      `- "${k.keyword}" (${k.risk_level}): ${k.law_reference} → 대안: ${k.safe_alternative}`
    ).join('\n');

    const systemPrompt = `당신은 근로기준법 전문 노무사입니다.
근로계약서 특약 조항을 검토하고 위험한 내용을 찾아 합법적인 대안을 제시합니다.
반드시 아래 JSON 형식으로만 답변하세요:
{
  "riskItems": [
    {
      "original": "원문 내용",
      "risk": "위험한 이유",
      "alternative": "합법적 대안 문구"
    }
  ],
  "safeTerms": ["이 내용은 법적으로 문제없습니다: ..."]
}
위험 항목이 없으면 riskItems는 빈 배열로 반환하세요.`;

    const userPrompt = `다음 근로계약서 특약 조항을 검토해주세요:

"${specialTerms}"

참고 위험 키워드 목록:
${keywordList}

위 특약에서 근로기준법에 위반되거나 근로자에게 불리한 조항을 찾아 합법적인 대안을 제시해주세요.`;

    const cacheKey = makeCacheKey('contract_terms', { terms: specialTerms.slice(0, 50) });

    const result = await callGPT(systemPrompt, userPrompt, {
      maxTokens: 600,
      temperature: 0.3,
      cacheKey,
      feature: 'contract-special-terms',
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: getLastError() || 'AI 특약 검토를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    }

    let parsed = { riskItems: [], safeTerms: [] };
    try {
      parsed = JSON.parse(result.text);
    } catch {
      // JSON 파싱 실패 시 기본값 유지
    }

    return NextResponse.json({ success: true, data: { ...result, ...parsed } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
