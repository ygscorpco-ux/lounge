import { getCurrentUser } from '../../../../lib/auth.js';
import { callGPT, getLastError } from '../../../../lib/gpt.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const contractData = await request.json();
    const {
      businessName, ceoName, workerName, employmentType,
      startDate, endDate, hourlyWage, hoursPerDay, workDays,
      specialTerms, taskDescription
    } = contractData;

    const systemPrompt = `당신은 근로기준법 전문 변호사입니다.
근로계약서 전체를 검토하고 법적 리스크를 분석합니다.
반드시 아래 JSON 형식으로만 답변하세요:
{
  "riskLevel": "낮음|보통|높음",
  "issues": [
    {
      "field": "항목명",
      "issue": "문제점",
      "suggestion": "개선 방안"
    }
  ],
  "overallComment": "전체 계약서에 대한 한 줄 총평"
}`;

    const userPrompt = `다음 근로계약서를 법적으로 검토해주세요:

사업장명: ${businessName}
대표자: ${ceoName}
근로자: ${workerName}
고용형태: ${employmentType}
근무기간: ${startDate} ~ ${endDate || '기간 정함 없음'}
시급: ${hourlyWage?.toLocaleString()}원
근무: 하루 ${hoursPerDay}시간, ${workDays?.join('·')}
업무: ${taskDescription || '미입력'}
특약: ${specialTerms || '없음'}

최저임금 준수 여부, 근무시간 적법성, 특약 조항의 법적 문제 등을 검토해주세요.`;

    const result = await callGPT(systemPrompt, userPrompt, {
      maxTokens: 500,
      temperature: 0.2,
      cacheKey: null, // 계약서 검토는 매번 새로 분석 (개인정보 포함)
      feature: 'contract-review',
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: getLastError() || 'AI 검토를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    }

    let parsed = { riskLevel: '보통', issues: [], overallComment: '' };
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
