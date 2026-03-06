import { recordMonitoringEvent } from "./monitoring-store.js";

let sentryNode = null;
let sentryInitialized = false;

const SLOW_API_MS = parseInt(process.env.SLOW_API_MS || "700", 10);

async function initSentryIfEnabled() {
  if (sentryInitialized) return;
  sentryInitialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    sentryNode = await import("@sentry/node");
    sentryNode.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    });
  } catch (error) {
    console.error("[monitoring] sentry init error:", error);
    sentryNode = null;
  }
}

export async function logSlowApi(routeName, startedAt, extra = {}) {
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < SLOW_API_MS) return;

  const payload = { route: routeName, elapsedMs, ...extra };
  console.warn("[slow-api]", JSON.stringify(payload));

  await initSentryIfEnabled();
  if (sentryNode) {
    sentryNode.captureMessage(`Slow API: ${routeName}`, {
      level: "warning",
      extra: payload,
    });
  }

  try {
    await recordMonitoringEvent({
      eventType: "slow_api",
      source: "api",
      name: routeName,
      severity: "warning",
      message: `Slow API: ${routeName}`,
      durationMs: elapsedMs,
      path: extra?.path || "",
      payload,
    });
  } catch (error) {
    console.error("[monitoring-store] slow_api write error:", error);
  }
}

export async function captureServerError(error, context = {}) {
  console.error("[server-error]", error, context);
  await initSentryIfEnabled();
  if (sentryNode) {
    sentryNode.captureException(error, {
      tags: { area: "api" },
      extra: context,
    });
  }

  try {
    await recordMonitoringEvent({
      eventType: "server_error",
      source: "api",
      name: context?.routeName || "unknown",
      severity: "error",
      message: error?.message || "server error",
      path: context?.path || "",
      payload: {
        context,
        stack: error?.stack ? String(error.stack).slice(0, 4000) : null,
      },
    });
  } catch (writeError) {
    console.error("[monitoring-store] server_error write error:", writeError);
  }
}

export async function withApiMonitoring(routeName, handler, extra = {}) {
  const startedAt = Date.now();
  try {
    const response = await handler();
    await logSlowApi(routeName, startedAt, extra);
    return response;
  } catch (error) {
    await captureServerError(error, { routeName, ...extra });
    throw error;
  }
}
