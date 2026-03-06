import pool from "../../../../lib/db.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { ROLE_ADMIN } from "../../../../lib/constants.js";
import { ensureMonitoringEventsTable } from "../../../../lib/monitoring-store.js";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { NextResponse } from "next/server";

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export async function GET(request) {
  return withApiMonitoring("admin.monitoring.GET", async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== ROLE_ADMIN) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }

      await ensureMonitoringEventsTable();

      const { searchParams } = new URL(request.url);
      const hours = clampInt(searchParams.get("hours"), 24, 1, 168);
      const limit = clampInt(searchParams.get("limit"), 120, 20, 500);
      const eventType = (searchParams.get("eventType") || "").trim().slice(0, 40);

      const whereParts = [
        `created_at >= (NOW() - INTERVAL ${hours} HOUR)`,
      ];
      const params = [];
      if (eventType) {
        whereParts.push("event_type = ?");
        params.push(eventType);
      }
      const where = whereParts.join(" AND ");

      const [summaryRows] = await pool.query(
        `SELECT event_type, COUNT(*) AS count
         FROM monitoring_events
         WHERE ${where}
         GROUP BY event_type`,
        params,
      );

      const [severityRows] = await pool.query(
        `SELECT severity, COUNT(*) AS count
         FROM monitoring_events
         WHERE ${where}
         GROUP BY severity`,
        params,
      );

      const [sourceRows] = await pool.query(
        `SELECT source, COUNT(*) AS count
         FROM monitoring_events
         WHERE ${where}
         GROUP BY source`,
        params,
      );

      const [slowRoutesRows] = await pool.query(
        `SELECT name, COUNT(*) AS count, AVG(duration_ms) AS avg_duration, MAX(duration_ms) AS max_duration
         FROM monitoring_events
         WHERE ${where}
           AND event_type = 'slow_api'
         GROUP BY name
         ORDER BY count DESC, max_duration DESC
         LIMIT 10`,
        params,
      );

      const [eventsRows] = await pool.query(
        `SELECT id, event_type, source, name, severity, message, duration_ms, path, payload_json, created_at
         FROM monitoring_events
         WHERE ${where}
         ORDER BY id DESC
         LIMIT ?`,
        [...params, limit],
      );

      const events = eventsRows.map((row) => {
        let payload = null;
        if (row.payload_json) {
          try {
            payload = JSON.parse(row.payload_json);
          } catch {
            payload = null;
          }
        }
        return {
          id: Number(row.id),
          eventType: row.event_type,
          source: row.source,
          name: row.name,
          severity: row.severity,
          message: row.message || "",
          durationMs: row.duration_ms === null ? null : Number(row.duration_ms),
          path: row.path || "",
          createdAt: row.created_at,
          payload,
        };
      });

      const totals = {
        total: events.length,
        byType: summaryRows.reduce((acc, row) => {
          acc[row.event_type] = Number(row.count || 0);
          return acc;
        }, {}),
        bySeverity: severityRows.reduce((acc, row) => {
          acc[row.severity] = Number(row.count || 0);
          return acc;
        }, {}),
        bySource: sourceRows.reduce((acc, row) => {
          acc[row.source] = Number(row.count || 0);
          return acc;
        }, {}),
      };

      const slowRoutes = slowRoutesRows.map((row) => ({
        name: row.name,
        count: Number(row.count || 0),
        avgDurationMs: Number(row.avg_duration || 0),
        maxDurationMs: Number(row.max_duration || 0),
      }));

      return NextResponse.json({
        hours,
        limit,
        filter: eventType || null,
        totals,
        slowRoutes,
        events,
      });
    } catch (error) {
      console.error("admin monitoring list error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
