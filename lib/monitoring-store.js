import pool from "./db.js";

let ensurePromise = null;
let lastCleanupAt = 0;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60;

export async function ensureMonitoringEventsTable() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(40) NOT NULL,
        source VARCHAR(80) NOT NULL,
        name VARCHAR(120) NOT NULL,
        severity VARCHAR(16) NOT NULL DEFAULT 'info',
        message VARCHAR(255) NULL,
        duration_ms INT NULL,
        path VARCHAR(255) NULL,
        payload_json TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_monitoring_events_created (created_at),
        INDEX idx_monitoring_events_type_source (event_type, source),
        INDEX idx_monitoring_events_name (name)
      )
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

export async function recordMonitoringEvent({
  eventType,
  source,
  name,
  severity = "info",
  message = "",
  durationMs = null,
  path = "",
  payload = null,
}) {
  await ensureMonitoringEventsTable();

  const safeEventType = String(eventType || "").slice(0, 40);
  const safeSource = String(source || "").slice(0, 80);
  const safeName = String(name || "").slice(0, 120);
  const safeSeverity = String(severity || "info").slice(0, 16);
  const safeMessage = String(message || "").slice(0, 255);
  const safePath = String(path || "").slice(0, 255);
  const safeDuration = Number.isFinite(Number(durationMs))
    ? Math.max(Math.round(Number(durationMs)), 0)
    : null;

  let payloadJson = null;
  if (payload !== null && payload !== undefined) {
    try {
      payloadJson = JSON.stringify(payload);
    } catch {
      payloadJson = JSON.stringify({ serializeError: true });
    }
    if (payloadJson && payloadJson.length > 20000) {
      payloadJson = payloadJson.slice(0, 20000);
    }
  }

  await pool.query(
    `INSERT INTO monitoring_events
      (event_type, source, name, severity, message, duration_ms, path, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      safeEventType,
      safeSource,
      safeName,
      safeSeverity,
      safeMessage || null,
      safeDuration,
      safePath || null,
      payloadJson,
    ],
  );

  // Keep the table bounded, but do not run cleanup on every single event write.
  const now = Date.now();
  if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    lastCleanupAt = now;
    await pool.query(
      "DELETE FROM monitoring_events WHERE created_at < (NOW() - INTERVAL 14 DAY)",
    );
  }
}
