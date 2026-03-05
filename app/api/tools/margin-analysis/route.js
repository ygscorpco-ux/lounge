import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { callGPT, makeCacheKey } from '../../../../lib/gpt.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, feeRate, menuPrice, menuCost, deliveryFee, marginRate, margin, industry } = body;

    // 업종 평균 데이터 조회 (있으면 GPT에 컨텍스트로 제공)
    let benchmark = null;
    if (industry) {
      const [[row]] = await pool.query(
        'SELECT * FROM industry_benchmarks WHERE industry = ? LIMIT 1',
        [industry]
      );
      benchmark = row || null;
    }

    const systemPrompt = `당신은 소상공인 수익성 분석 전문가입니다. 
배달앱을 운영하는 사장님들에게 실마진 분석 결과를 바탕으로 실용적인 조언을 제공합니다.
반드시 3줄 이내로, 친근한 말투로, 이모지를 활용해서 답변하세요.
구체적인 숫자나 행동 방안을 포함하세요.`;

    const userPrompt = `다음은 배달앱 실마진 계산 결과입니다:
- 플랫폼: ${platform}
- 수수료율: ${feeRate}%
- 판매가: ${menuPrice?.toLocaleString()}원
- 원가: ${menuCost?.toLocaleString()}원
- 배달비 부담: ${deliveryFee?.toLocaleString()}원
- 실마진: ${margin?.toLocaleString()}원 (${marginRate?.toFixed(1)}%)
${benchmark ? `- ${industry} 업종 평균 마진율: ${benchmark.avg_margin_rate}%, 평균 배달비율: ${benchmark.avg_delivery_rate}%` : ''}

이 수익성을 개선하기 위한 현실적인 조언을 해주세요.`;

    // 같은 입력값이면 24시간 캐시 활용 (GPT 비용 절감)
    const cacheKey = makeCacheKey('margin', {
      platform, feeRate,
      priceRange: Math.round((menuPrice || 0) / 1000),
      costRange: Math.round((menuCost || 0) / 1000),
      marginRange: Math.round(marginRate || 0),
    });

    const result = await callGPT(systemPrompt, userPrompt, {
      maxTokens: 300,
      temperature: 0.7,
      cacheKey,
      feature: 'margin-analysis',
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'AI 분석을 일시적으로 사용할 수 없습니다' }, { status: 503 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('margin-analysis error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
