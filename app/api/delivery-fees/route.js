export const dynamic = 'force-dynamic';
import pool from '../../../lib/db.js';
import { NextResponse } from 'next/server';

// 공개 API — 로그인 불필요
// 배달 플랫폼 + 수수료 구간 정보를 JOIN해서 반환
export async function GET() {
  try {
    const [platforms] = await pool.query(
      `SELECT platform_id, name, color, sort_order
       FROM delivery_platforms
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );

    const [tiers] = await pool.query(
      `SELECT id, platform_id, tier_label, fee_rate, payment_fee_rate,
              vat_included, delivery_min, delivery_max, packaging_fee,
              is_default, memo, updated_at
       FROM delivery_fee_tiers
       WHERE is_active = 1
       ORDER BY platform_id, is_default DESC, fee_rate ASC`
    );

    // 플랫폼별로 수수료 구간 묶기
    const result = platforms.map(p => ({
      ...p,
      tiers: tiers.filter(t => t.platform_id === p.platform_id),
    }));

    // 마지막 업데이트 시각 (가장 최근 수수료 변경 기준)
    const lastUpdated = tiers.reduce((acc, t) => {
      return !acc || new Date(t.updated_at) > new Date(acc) ? t.updated_at : acc;
    }, null);

    return NextResponse.json({ success: true, data: result, lastUpdated });
  } catch (error) {
    console.error('[delivery-fees]', error.message);
    return NextResponse.json({ success: false, error: '수수료 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
