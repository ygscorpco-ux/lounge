import { NextResponse } from "next/server";
import { withApiMonitoring } from "../../../../lib/monitoring.js";
import { recordMonitoringEvent } from "../../../../lib/monitoring-store.js";

const VITAL_WARNING_THRESHOLDS = {
  CLS: 0.25,
  LCP: 4000,
  INP: 300,
  FCP: 3000,
  TTFB: 1800,
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldWarn(metricName, metricValue) {
  const threshold = VITAL_WARNING_THRESHOLDS[metricName];
  if (!Number.isFinite(threshold)) return false;
  return metricValue >= threshold;
}

export async function POST(request) {
  return withApiMonitoring("monitoring.webvitals.POST", async () => {
    try {
      const raw = await request.text();
      if (!raw) {
        return NextResponse.json({ ok: true, ignored: true });
      }

      let payload = null;
      try {
        payload = JSON.parse(raw);
      } catch {
        return NextResponse.json({ ok: true, ignored: true });
      }

      const metricName = String(payload?.name || "").toUpperCase();
      const metricValue = toNumber(payload?.value);
      const metricId = String(payload?.id || "");

      if (!metricName || metricValue === null) {
        return NextResponse.json({ error: "Invalid metric payload" }, { status: 400 });
      }

      const logPayload = {
        metricName,
        metricValue,
        metricId,
        rating: payload?.rating || "unknown",
        path: payload?.path || "",
        ts: payload?.ts || Date.now(),
      };

      if (shouldWarn(metricName, metricValue)) {
        console.warn("[web-vitals][warning]", JSON.stringify(logPayload));
      } else {
        console.log("[web-vitals]", JSON.stringify(logPayload));
      }

      try {
        await recordMonitoringEvent({
          eventType: "web_vitals",
          source: "web",
          name: metricName,
          severity: shouldWarn(metricName, metricValue) ? "warning" : "info",
          message: `Web Vital ${metricName}`,
          durationMs: Math.round(metricValue),
          path: payload?.path || "",
          payload: logPayload,
        });
      } catch (writeError) {
        console.error("web-vitals event write error:", writeError);
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("web-vitals ingest error:", error);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }
  });
}
