import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 계약서 데이터 유효성 검증 (서버사이드) + 향후 DB 저장용
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });

    const body = await request.json();

    const required = ['businessName', 'ceoName', 'address', 'workerName', 'endDate', 'wage'];
    const missing  = required.filter(k => !body[k]);

    if (missing.length) {
      return NextResponse.json({ success: false, error: `미입력 항목: ${missing.join(', ')}` }, { status: 400 });
    }

    // 향후 contracts 테이블 저장 로직 추가 가능
    return NextResponse.json({ success: true, message: '계약서 검증 완료' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
