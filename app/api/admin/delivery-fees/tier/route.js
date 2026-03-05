import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 새 수수료 구간 추가
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 가능합니다' }, { status: 403 });
    }

    const {
      platform_id, tier_label, fee_rate,
      payment_fee_rate = 0, vat_included = 0,
      delivery_min = 0, delivery_max = 0,
      packaging_fee = 0, is_default = 0, memo = ''
    } = await request.json();

    if (!platform_id || fee_rate === undefined) {
      return NextResponse.json({ success: false, error: 'platform_id와 fee_rate는 필수입니다' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO delivery_fee_tiers
       (platform_id, tier_label, fee_rate, payment_fee_rate, vat_included,
        delivery_min, delivery_max, packaging_fee, is_default, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [platform_id, tier_label, fee_rate, payment_fee_rate, vat_included,
       delivery_min, delivery_max, packaging_fee, is_default, memo]
    );

    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
