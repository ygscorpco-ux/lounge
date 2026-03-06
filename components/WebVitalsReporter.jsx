"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

let sentryBrowser = null;
let sentryInitPromise = null;

async function initBrowserSentry() {
  if (sentryBrowser) return sentryBrowser;
  if (sentryInitPromise) return sentryInitPromise;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;

  sentryInitPromise = import("@sentry/browser")
    .then((module) => {
      module.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.05),
      });
      sentryBrowser = module;
      return module;
    })
    .catch((error) => {
      console.error("browser sentry init error:", error);
      sentryBrowser = null;
      return null;
    });

  return sentryInitPromise;
}

async function sendMetricToSentry(payload) {
  const sentry = await initBrowserSentry();
  if (!sentry) return;
  sentry.captureMessage(`Web Vital ${payload.name}`, {
    level: payload.rating === "good" ? "info" : "warning",
    tags: {
      source: "web-vitals",
      metric: payload.name,
      rating: payload.rating,
    },
    extra: payload,
  });
}

function sendMetricToApi(payload) {
  const data = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(
      "/api/monitoring/web-vitals",
      new Blob([data], { type: "application/json" }),
    );
    if (sent) return;
  }

  fetch("/api/monitoring/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
    keepalive: true,
  }).catch((error) => {
    console.error("web-vitals send error:", error);
  });
}

export default function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    const payload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      path: pathname || "/",
      ts: Date.now(),
    };

    sendMetricToApi(payload);
    if (payload.rating !== "good") {
      sendMetricToSentry(payload);
    }
  });

  return null;
}
