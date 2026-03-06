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
      "ALTER TABLE posts ADD COLUMN notice_order INT NOT NULL DEFAULT 4",
    );

    try {
      await pool.query(
        "ALTER TABLE posts ALTER COLUMN notice_order SET DEFAULT 4",
      );
    } catch (error) {
      // Keep running on MySQL variants that do not support this form.
    }

    await pool.query(
      `UPDATE posts
       SET notice_order = 4
       WHERE is_notice = TRUE
         AND (notice_order IS NULL OR notice_order < 1 OR notice_order > 4)`,
    );

    await addIndexIfMissing(
      "CREATE INDEX idx_posts_notice_display ON posts (is_notice, notice_visible, notice_order, created_at)",
    );
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}
