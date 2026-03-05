import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 관리자만 실행 가능
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "관리자만 실행 가능합니다" },
        { status: 403 },
      );
    }

    const created = [];

    // 1. 배달앱 기본 정보
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_platforms (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        platform_id VARCHAR(20) NOT NULL UNIQUE,
        name        VARCHAR(50) NOT NULL,
        color       VARCHAR(10),
        is_active   TINYINT DEFAULT 1,
        sort_order  INT DEFAULT 0,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    created.push("delivery_platforms");

    // 2. 수수료 구간별 상세 (platform_id로 delivery_platforms 참조)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_fee_tiers (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        platform_id      VARCHAR(20) NOT NULL,
        tier_label       VARCHAR(100),
        fee_rate         DECIMAL(5,2) NOT NULL,
        payment_fee_rate DECIMAL(5,2) DEFAULT 0,
        vat_included     TINYINT DEFAULT 0,
        delivery_min     INT DEFAULT 0,
        delivery_max     INT DEFAULT 0,
        packaging_fee    DECIMAL(5,2) DEFAULT 0,
        is_default       TINYINT DEFAULT 0,
        is_active        TINYINT DEFAULT 1,
        memo             TEXT,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    created.push("delivery_fee_tiers");

    // 3. 수수료 변경 이력 (tier_id로 delivery_fee_tiers 참조)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_fee_history (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        tier_id       INT NOT NULL,
        platform_id   VARCHAR(20),
        tier_label    VARCHAR(100),
        field_changed VARCHAR(50),
        value_before  DECIMAL(10,2),
        value_after   DECIMAL(10,2),
        memo          TEXT,
        changed_by    INT,
        changed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    created.push("delivery_fee_history");

    // 4. GPT 호출 비용 추적 (user_id로 users 참조)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gpt_usage_log (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          INT,
        feature          VARCHAR(50),
        prompt_tokens    INT,
        completion_tokens INT,
        estimated_cost   DECIMAL(10,6),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    created.push("gpt_usage_log");

    // 5. GPT 응답 캐시 — 중복 호출 방지, expires_at으로 만료 관리
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gpt_cache (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        cache_key     VARCHAR(255) UNIQUE,
        feature       VARCHAR(50),
        response_text TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at    TIMESTAMP NULL
      )
    `);
    created.push("gpt_cache");

    // 6. 업종별 평균 데이터 (마진 계산기 비교 기준용)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_benchmarks (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        industry            VARCHAR(50),
        avg_margin_rate     DECIMAL(5,2),
        avg_labor_cost_rate DECIMAL(5,2),
        avg_delivery_rate   DECIMAL(5,2),
        data_year           INT,
        updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    created.push("industry_benchmarks");

    // 7. 계약서 위험 키워드 사전 (ENUM: high/medium/low)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS labor_risk_keywords (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        keyword         VARCHAR(100),
        risk_level      ENUM('high','medium','low'),
        law_reference   VARCHAR(200),
        safe_alternative TEXT
      )
    `);
    created.push("labor_risk_keywords");

    // 8. 사장님 프로필 (지원금 추천 매칭용, user_id UNIQUE)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_profile (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        user_id               INT UNIQUE,
        industry              VARCHAR(50),
        region                VARCHAR(100),
        business_years        INT,
        employee_count        INT,
        monthly_revenue_range VARCHAR(20),
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    created.push("owner_profile");

    return NextResponse.json({
      success: true,
      message: `총 ${created.length}개 테이블 생성 완료`,
      tables: created,
    });
  } catch (error) {
    console.error("migrate-delivery error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
