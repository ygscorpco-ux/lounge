import pool from '../../../../../lib/db.js';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { NextResponse } from 'next/server';

// 수수료 구간 수정 — 변경 전후 이력 자동 기록
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 가능합니다' }, { status: 403 });
    }

    const id = params.id;
    const body = await request.json();

    // 수정 전 기존값 조회
    const [[before]] = await pool.query(
      'SELECT * FROM delivery_fee_tiers WHERE id = ?', [id]
    );
    if (!before) {
      return NextResponse.json({ success: false, error: '해당 구간을 찾을 수 없습니다' }, { status: 404 });
    }

    const {
      tier_label, fee_rate, payment_fee_rate,
      vat_included, delivery_min, delivery_max,
      packaging_fee, is_default, memo
    } = body;

    await pool.query(
      `UPDATE delivery_fee_tiers
       SET tier_label=?, fee_rate=?, payment_fee_rate=?,
           vat_included=?, delivery_min=?, delivery_max=?,
           packaging_fee=?, is_default=?, memo=?
       WHERE id=?`,
      [tier_label, fee_rate, payment_fee_rate,
       vat_included, delivery_min, delivery_max,
       packaging_fee, is_default, memo, id]
    );

    // 변경된 필드마다 이력 기록
    const trackedFields = ['fee_rate', 'payment_fee_rate', 'packaging_fee', 'delivery_min', 'delivery_max'];
    for (const field of trackedFields) {
      if (body[field] !== undefined && parseFloat(before[field]) !== parseFloat(body[field])) {
        await pool.query(
          `INSERT INTO delivery_fee_history
           (tier_id, platform_id, tier_label, field_changed, value_before, value_after, changed_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, before.platform_id, tier_label || before.tier_label,
           field, before[field], body[field], user.id]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('delivery-fees PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 수수료 구간 삭제 (소프트 삭제)
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 가능합니다' }, { status: 403 });
    }

    await pool.query(
      'UPDATE delivery_fee_tiers SET is_active = 0 WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
