import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 실행할 수 있습니다' }, { status: 403 });
    }

    // subsidies 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subsidies (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        category    VARCHAR(50)  NOT NULL DEFAULT '자금지원',
        start_date  DATE,
        end_date    DATE NOT NULL,
        target      VARCHAR(255),
        description TEXT,
        url         VARCHAR(500),
        amount      VARCHAR(100),
        is_active   TINYINT(1) DEFAULT 1,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 샘플 데이터 삽입 (이미 있으면 skip)
    await pool.query(`
      INSERT IGNORE INTO subsidies (id, title, category, start_date, end_date, target, description, url, amount) VALUES
      (1, '소상공인 경영안정자금 신청', '자금지원', '2025-03-01', '2025-03-31', '소상공인 전체', '소상공인시장진흥공단 운영자금 대출. 연 2~3% 금리 적용.', 'https://www.semas.or.kr', '최대 7,000만원'),
      (2, '청년 고용 장려금 신청',     '자금지원', '2025-03-10', '2025-05-10', '15~34세 청년 신규채용 사업주', '청년 신규 채용 시 최대 1년간 월 80만원 지원.', 'https://www.work.go.kr', '월 80만원'),
      (3, '소상공인 디지털 전환 바우처','자금지원', '2025-04-01', '2025-06-30', '소상공인 전체', 'POS·키오스크·배달앱 수수료 지원 바우처 사업.', 'https://www.semas.or.kr', '최대 400만원'),
      (4, '배달환경 개선 지원사업',     '자금지원', '2025-03-15', '2025-04-30', '배달앱 이용 소상공인', '친환경 포장재 전환 비용 지원.', '', '최대 200만원'),
      (5, '소상공인 온라인 마케팅 교육','교육',     '2025-03-05', '2025-03-28', '소상공인 전체', 'SNS 마케팅, 스마트스토어, 쿠팡 입점 실무 교육.', '', '무료'),
      (6, '스마트 상점 전환 교육',      '교육',     '2025-04-01', '2025-04-25', '소상공인 전체', '키오스크·무인결제 시스템 도입 실습 교육.', '', '무료'),
      (7, '폐업·재창업 맞춤 컨설팅',   '컨설팅',   '2025-03-01', '2025-04-15', '폐업 예정 또는 재창업 소상공인', '전문 컨설턴트 1:1 맞춤 컨설팅 (최대 10회).', '', '무료'),
      (8, '부가가치세 납부유예',         '세금혜택', '2025-03-01', '2025-03-31', '매출 감소 소상공인', '매출 30% 이상 감소 시 부가세 최대 6개월 유예.', 'https://www.nts.go.kr', '-'),
      (9, '소규모 사업자 세금 감면',     '세금혜택', '2025-03-01', '2025-05-31', '연매출 4,800만원 이하 소상공인', '간이과세자 부가세 납부의무 면제 및 감면.', 'https://www.nts.go.kr', '-')
    `);

    return NextResponse.json({ success: true, message: 'subsidies 테이블 생성 및 샘플 데이터 삽입 완료' });
  } catch (error) {
    console.error('subsidy migrate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
