import pool from '../../../../lib/db.js';
import { getCurrentUser } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자만 실행 가능합니다' }, { status: 403 });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          INT NOT NULL,
        name             VARCHAR(50) NOT NULL,
        phone            VARCHAR(20),
        birth_date       DATE,
        employment_type  ENUM('정규','단기','일용') DEFAULT '정규',
        hourly_wage      INT NOT NULL DEFAULT 10320,
        work_days        VARCHAR(50) DEFAULT '월,화,수,목,금',
        start_time       VARCHAR(10) DEFAULT '09:00',
        end_time         VARCHAR(10) DEFAULT '18:00',
        contract_start   DATE,
        contract_end     DATE,
        task_description TEXT,
        color            VARCHAR(20) DEFAULT '#1b4797',
        is_active        TINYINT(1) DEFAULT 1,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_schedule (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        worker_id      INT NOT NULL,
        work_date      DATE NOT NULL,
        clock_in       VARCHAR(10),
        clock_out      VARCHAR(10),
        break_minutes  INT DEFAULT 60,
        status         ENUM('정상출근','결근','지각','조퇴') DEFAULT '정상출근',
        memo           TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_worker_date (worker_id, work_date)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS salary_record (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        worker_id         INT NOT NULL,
        year              INT NOT NULL,
        month             INT NOT NULL,
        total_hours       DECIMAL(6,2) DEFAULT 0,
        total_days        INT DEFAULT 0,
        base_wage         INT DEFAULT 0,
        weekly_allowance  INT DEFAULT 0,
        deduction         INT DEFAULT 0,
        net_wage          INT DEFAULT 0,
        is_settled        TINYINT(1) DEFAULT 0,
        settled_at        TIMESTAMP NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_worker_period (worker_id, year, month)
      )
    `);

    return NextResponse.json({ success: true, message: 'workers / work_schedule / salary_record 테이블 생성 완료' });
  } catch (error) {
    console.error('workers migrate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
