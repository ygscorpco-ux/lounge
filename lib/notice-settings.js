import pool from "./db.js";

let ensurePromise = null;
let ensured = false;

async function getPostColumns() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'posts'`,
  );
  return new Set(rows.map((row) => String(row.COLUMN_NAME)));
}

async function getPostIndexes() {
  const [rows] = await pool.query(
    `SELECT DISTINCT INDEX_NAME
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'posts'`,
  );
  return new Set(rows.map((row) => String(row.INDEX_NAME)));
}

export async function ensureNoticeSettingsColumns() {
  if (ensured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const columns = await getPostColumns();

    if (!columns.has("notice_visible")) {
      await pool.query(
        "ALTER TABLE posts ADD COLUMN notice_visible BOOLEAN NOT NULL DEFAULT TRUE",
      );
      columns.add("notice_visible");
    }
    if (!columns.has("notice_order")) {
      await pool.query(
        "ALTER TABLE posts ADD COLUMN notice_order INT NOT NULL DEFAULT 1000",
      );
      columns.add("notice_order");
    }
    if (!columns.has("notice_start_at")) {
      await pool.query(
        "ALTER TABLE posts ADD COLUMN notice_start_at DATETIME NULL",
      );
      columns.add("notice_start_at");
    }
    if (!columns.has("notice_end_at")) {
      await pool.query(
        "ALTER TABLE posts ADD COLUMN notice_end_at DATETIME NULL",
      );
      columns.add("notice_end_at");
    }

    try {
      await pool.query(
        "ALTER TABLE posts ALTER COLUMN notice_order SET DEFAULT 1000",
      );
    } catch (error) {
      // Keep running on MySQL variants that do not support this form.
    }

    if (columns.has("is_notice") && columns.has("notice_order")) {
      await pool.query(
        `UPDATE posts
         SET notice_order = 1000
         WHERE is_notice = TRUE
           AND (notice_order IS NULL OR notice_order < 1)`,
      );
    }

    const indexes = await getPostIndexes();

    if (!indexes.has("idx_posts_notice_display")) {
      const hasPinSlot = columns.has("notice_pin_slot");
      const indexColumns = hasPinSlot
        ? "is_notice, notice_visible, notice_pin_slot, notice_order, created_at"
        : "is_notice, notice_visible, notice_order, created_at";
      await pool.query(
        `CREATE INDEX idx_posts_notice_display ON posts (${indexColumns})`,
      );
    }
    if (!indexes.has("idx_posts_notice_window")) {
      await pool.query(
        "CREATE INDEX idx_posts_notice_window ON posts (notice_start_at, notice_end_at)",
      );
    }

    ensured = true;
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    ensured = false;
    throw error;
  }
}
