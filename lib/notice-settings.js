import pool from "./db.js";

let ensurePromise = null;

async function addColumnIfMissing(sql) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
}

async function addIndexIfMissing(sql) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }
}

export async function ensureNoticeSettingsColumns() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await addColumnIfMissing(
      "ALTER TABLE posts ADD COLUMN notice_visible BOOLEAN NOT NULL DEFAULT TRUE",
    );
    await addColumnIfMissing(
      "ALTER TABLE posts ADD COLUMN notice_pin_slot TINYINT NULL DEFAULT NULL",
    );
    await addColumnIfMissing(
      "ALTER TABLE posts ADD COLUMN notice_order INT NOT NULL DEFAULT 1000",
    );

    await addIndexIfMissing(
      "CREATE INDEX idx_posts_notice_display ON posts (is_notice, notice_visible, notice_pin_slot, notice_order, created_at)",
    );
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}
