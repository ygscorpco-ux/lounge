import mysql from "mysql2/promise";
import * as dotenv from "fs";

// .env.local 직접 읽기
const envFile = new URL("../.env.local", import.meta.url);
const envContent = dotenv.readFileSync(envFile, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT || "3306"),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});

const tables = [
  {
    name: "delivery_platforms",
    sql: `CREATE TABLE IF NOT EXISTS delivery_platforms (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      platform_id VARCHAR(20) NOT NULL UNIQUE,
      name        VARCHAR(50) NOT NULL,
      color       VARCHAR(10),
      is_active   TINYINT DEFAULT 1,
      sort_order  INT DEFAULT 0,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
  {
    name: "delivery_fee_tiers",
    sql: `CREATE TABLE IF NOT EXISTS delivery_fee_tiers (
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
    )`,
  },
  {
    name: "delivery_fee_history",
    sql: `CREATE TABLE IF NOT EXISTS delivery_fee_history (
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
    )`,
  },
  {
    name: "gpt_usage_log",
    sql: `CREATE TABLE IF NOT EXISTS gpt_usage_log (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      user_id           INT,
      feature           VARCHAR(50),
      prompt_tokens     INT,
      completion_tokens INT,
      estimated_cost    DECIMAL(10,6),
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    name: "gpt_cache",
    sql: `CREATE TABLE IF NOT EXISTS gpt_cache (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      cache_key     VARCHAR(255) UNIQUE,
      feature       VARCHAR(50),
      response_text TEXT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at    TIMESTAMP NULL
    )`,
  },
  {
    name: "industry_benchmarks",
    sql: `CREATE TABLE IF NOT EXISTS industry_benchmarks (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      industry            VARCHAR(50),
      avg_margin_rate     DECIMAL(5,2),
      avg_labor_cost_rate DECIMAL(5,2),
      avg_delivery_rate   DECIMAL(5,2),
      data_year           INT,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
  {
    name: "labor_risk_keywords",
    sql: `CREATE TABLE IF NOT EXISTS labor_risk_keywords (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      keyword          VARCHAR(100),
      risk_level       ENUM('high','medium','low'),
      law_reference    VARCHAR(200),
      safe_alternative TEXT
    )`,
  },
  {
    name: "owner_profile",
    sql: `CREATE TABLE IF NOT EXISTS owner_profile (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      user_id               INT UNIQUE,
      industry              VARCHAR(50),
      region                VARCHAR(100),
      business_years        INT,
      employee_count        INT,
      monthly_revenue_range VARCHAR(20),
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  },
];

try {
  for (const t of tables) {
    await pool.query(t.sql);
    console.log(`✅ ${t.name} 생성 완료`);
  }
  console.log("\n🎉 완료: 8개 테이블 모두 생성됨");
} catch (err) {
  console.error("❌ 에러:", err.message);
} finally {
  await pool.end();
}
