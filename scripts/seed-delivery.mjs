import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.includes('=')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT || '3306'),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

try {
  // 기존 데이터 있으면 중복 INSERT 방지 (IGNORE)
  await pool.query(`
    INSERT IGNORE INTO delivery_platforms (platform_id, name, color, sort_order) VALUES
    ('baemin',  '배달의민족', '#2AC1BC', 1),
    ('coupang', '쿠팡이츠',   '#C00C1E', 2),
    ('yogiyo',  '요기요',     '#FA2258', 3),
    ('ddangyo', '땡겨요',     '#FF6B35', 4)
  `);
  console.log('✅ delivery_platforms 데이터 삽입 완료');

  // 기존 데이터 삭제 후 재삽입 (수수료는 최신값으로 유지)
  await pool.query(`DELETE FROM delivery_fee_tiers WHERE platform_id IN ('baemin','coupang','yogiyo','ddangyo')`);

  await pool.query(`
    INSERT INTO delivery_fee_tiers
    (platform_id, tier_label, fee_rate, payment_fee_rate, vat_included, delivery_min, delivery_max, packaging_fee, is_default)
    VALUES
    ('baemin','상위 35% 이내 (우대)',       7.8, 3.0, 0, 2400, 3400, 6.8, 0),
    ('baemin','상위 35~80% (일반)',          6.8, 1.5, 0, 2100, 3100, 6.8, 1),
    ('baemin','하위 20% (영세)',             2.0, 1.5, 0, 1900, 2900, 0.0, 0),
    ('coupang','상위 35% 이내 (우대)',       7.8, 0,   0, 1900, 3100, 6.8, 0),
    ('coupang','상위 35~80% (일반)',         6.8, 0,   0, 1900, 2900, 6.8, 1),
    ('coupang','하위 20% (영세)',            2.0, 0,   0, 1900, 2900, 0.0, 0),
    ('yogiyo','기본 (요기배달)',             9.7, 3.0, 0, 2900, 2900, 7.7, 1),
    ('yogiyo','주문많은 업체 우대',          4.7, 3.0, 0, 2900, 2900, 2.7, 0),
    ('ddangyo','전체',                       2.0, 1.5, 0, 0,    0,    0.0, 1)
  `);
  console.log('✅ delivery_fee_tiers 데이터 삽입 완료');

  await pool.query(`
    INSERT IGNORE INTO industry_benchmarks
    (industry, avg_margin_rate, avg_labor_cost_rate, avg_delivery_rate, data_year) VALUES
    ('카페',  18, 28, 22, 2026),
    ('치킨',  22, 18, 30, 2026),
    ('피자',  25, 20, 28, 2026),
    ('한식',  15, 32, 25, 2026),
    ('분식',  20, 25, 20, 2026),
    ('중식',  23, 22, 27, 2026)
  `);
  console.log('✅ industry_benchmarks 데이터 삽입 완료');

  await pool.query(`
    INSERT IGNORE INTO labor_risk_keywords
    (keyword, risk_level, law_reference, safe_alternative) VALUES
    ('벌금',      'high',   '근로기준법 제96조', '지각 시 해당 시간만큼 근무시간에서 차감한다'),
    ('배상',      'high',   '근로기준법 제24조', '고의 또는 중과실로 인한 손해는 협의하여 처리한다'),
    ('유니폼 구매','medium','근로기준법 제20조', '회사 제공 유니폼을 착용한다'),
    ('계약 해지', 'medium', '근로기준법 제26조', '30일 전 서면 통보 후 계약을 종료할 수 있다'),
    ('포괄임금',  'high',   '근로기준법 제56조', '연장·야간·휴일근로는 별도 수당을 지급한다')
  `);
  console.log('✅ labor_risk_keywords 데이터 삽입 완료');

  console.log('\n🎉 시드 데이터 삽입 완료!');
} catch (err) {
  console.error('❌ 에러:', err.message);
} finally {
  await pool.end();
}
