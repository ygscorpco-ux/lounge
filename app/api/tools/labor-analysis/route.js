import { getCurrentUser } from '../../../../lib/auth.js';
import { callGPT, makeCacheKey } from '../../../../lib/gpt.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { hourlyWage, hoursPerDay, daysPerWeek, employmentType, insuranceOn, bossTotal, netWage, numWorkers } = await request.json();

    const systemPrompt = `당신은 소상공인 인건비 절감 전문가입니다.
반드시 합법적인 방법만 제안하세요.
3줄 이내, 친근한 말투, 이모지 활용.
실질적이고 즉시 적용 가능한 방법을 알려주세요.`;

    const userPrompt = `인건비 현황을 분석해주세요:
- 시급: ${hourlyWage?.toLocaleString()}원
- 하루 근무: ${hoursPerDay}시간 × 주 ${daysPerWeek}일
- 고용형태: ${employmentType === 'regular' ? '정규 알바' : '단기·일용직'}
- 4대보험: ${insuranceOn ? '적용' : '미적용'}
- 근로자 월 실수령: ${netWage?.toLocaleString()}원
- 사장 월 총 지출: ${bossTotal?.toLocaleString()}원
${numWorkers > 1 ? `- 직원 ${numWorkers}명 기준 총 인건비: ${(bossTotal * numWorkers)?.toLocaleString()}원` : ''}

합법적으로 인건비를 효율화할 수 있는 방법을 알려주세요.`;

    const cacheKey = makeCacheKey('labor', {
      wageRange: Math.round((hourlyWage || 0) / 500) * 500,
      hours: hoursPerDay,
      days: daysPerWeek,
      type: employmentType,
      insurance: insuranceOn,
    });

    const result = await callGPT(systemPrompt, userPrompt, {
      maxTokens: 300,
      temperature: 0.7,
      cacheKey,
      feature: 'labor-analysis',
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'AI 분석을 일시적으로 사용할 수 없습니다' }, { status: 503 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
