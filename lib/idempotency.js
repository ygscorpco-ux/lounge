import { createHash } from "crypto";
import pool from "./db.js";

let ensurePromise = null;

function stableStringify(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashIdempotencyPayload(payload) {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export async function ensureIdempotencyTable() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_idempotency_keys (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        scope VARCHAR(64) NOT NULL,
        idempotency_key VARCHAR(128) NOT NULL,
        request_hash CHAR(64) NOT NULL,
        status ENUM('processing', 'completed') NOT NULL DEFAULT 'processing',
        response_status INT NULL,
        response_body TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_api_idempotency (user_id, scope, idempotency_key),
        INDEX idx_api_idempotency_created (created_at)
      )
    `);

    // Purge stale rows to keep table compact.
    await pool.query(
      "DELETE FROM api_idempotency_keys WHERE created_at < (NOW() - INTERVAL 3 DAY)",
    );
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

function tryParseResponseBody(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: String(raw) };
  }
}

export async function reserveIdempotencyKey({
  userId,
  scope,
  idempotencyKey,
  requestHash,
}) {
  if (!idempotencyKey) {
    return { mode: "none" };
  }

  await ensureIdempotencyTable();

  try {
    await pool.query(
      `INSERT INTO api_idempotency_keys
       (user_id, scope, idempotency_key, request_hash, status)
       VALUES (?, ?, ?, ?, 'processing')`,
      [userId, scope, idempotencyKey, requestHash],
    );
    return { mode: "new" };
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;
  }

  const [rows] = await pool.query(
    `SELECT request_hash, status, response_status, response_body
     FROM api_idempotency_keys
     WHERE user_id = ?
       AND scope = ?
       AND idempotency_key = ?
     LIMIT 1`,
    [userId, scope, idempotencyKey],
  );

  if (rows.length === 0) {
    return { mode: "none" };
  }

  const row = rows[0];
  if (row.request_hash !== requestHash) {
    return { mode: "conflict" };
  }

  if (row.status === "completed") {
    return {
      mode: "replay",
      status: row.response_status || 200,
      body: tryParseResponseBody(row.response_body),
    };
  }

  return { mode: "processing" };
}

export async function completeIdempotencyKey({
  userId,
  scope,
  idempotencyKey,
  status,
  body,
}) {
  if (!idempotencyKey) return;

  await pool.query(
    `UPDATE api_idempotency_keys
     SET status = 'completed',
         response_status = ?,
         response_body = ?
     WHERE user_id = ?
       AND scope = ?
       AND idempotency_key = ?`,
    [status, JSON.stringify(body ?? {}), userId, scope, idempotencyKey],
  );
}

export async function clearIdempotencyKey({ userId, scope, idempotencyKey }) {
  if (!idempotencyKey) return;
  await pool.query(
    `DELETE FROM api_idempotency_keys
     WHERE user_id = ?
       AND scope = ?
       AND idempotency_key = ?`,
    [userId, scope, idempotencyKey],
  );
}
