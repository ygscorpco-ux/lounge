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

    const { industry, region, businessYears, employeeCount, monthlyRevenueRange } = await request.json();

    // 사장님 프로필 저장/업데이트
    await pool.query(
      `INSERT INTO owner_profile (user_id, industry, region, business_years, employee_count, monthly_revenue_range)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         industry = VALUES(industry),
         region = VALUES(region),
         business_years = VALUES(business_years),
         employee_count = VALUES(employee_count),
         monthly_revenue_range = VALUES(monthly_revenue_range),
         updated_at = NOW()`,
      [user.id, industry, region, businessYears, employeeCount, monthlyRevenueRange]
    );

    // 활성 지원금 전체 조회 (현재 날짜 기준 마감 안된 것)
    const [subsidies] = await pool.query(
      `SELECT title, category, target, end_date, description, amount
       FROM subsidy_calendar
       WHERE is_active = 1 AND end_date >= CURDATE()
       ORDER BY end_date ASC
       LIMIT 20`
    );

    if (subsidies.length === 0) {
      return NextResponse.json({
        success: true,
        data: { text: '현재 등록된 지원금이 없습니다. 관리자에게 문의해주세요.', cached: false, recommendations: [] }
      });
    }

    const subsidyList = subsidies.map((s, i) =>
      `${i + 1}. [${s.category}] ${s.title} - 대상: ${s.target || '소상공인 전체'}, 마감: ${s.end_date}`
    ).join('\n');

    const systemPrompt = `당신은 소상공인 지원사업 전문 컨설턴트입니다.
사장님 프로필을 분석해서 가장 적합한 지원금 TOP 3를 추천해주세요.
JSON 형식으로만 답변하세요: { "recommendations": [{ "rank": 1, "title": "...", "reason": "...", "urgency": "높음|보통|낮음" }] }`;

    const userPrompt = `사장님 프로필:
- 업종: ${industry || '미입력'}
- 지역: ${region || '미입력'}
- 업력: ${businessYears || 0}년
- 직원수: ${employeeCount || 0}명
- 월매출: ${monthlyRevenueRange || '미입력'}

현재 신청 가능한 지원금 목록:
${subsidyList}

이 사장님에게 가장 적합한 지원금 TOP 3를 추천해주세요.`;

    const cacheKey = makeCacheKey('subsidy', { industry, region, businessYears, employeeCount });

    const result = await callGPT(systemPrompt, userPrompt, {
      maxTokens: 500,
      temperature: 0.5,
      cacheKey,
      feature: 'subsidy-recommend',
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: getLastError() || 'AI 추천을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    }

    // JSON 파싱 시도 — 실패해도 텍스트로 반환
    let recommendations = [];
    try {
      const parsed = JSON.parse(result.text);
      recommendations = parsed.recommendations || [];
    } catch {
      // JSON 파싱 실패 시 텍스트 그대로 반환
    }

    return NextResponse.json({
      success: true,
      data: { ...result, recommendations }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
