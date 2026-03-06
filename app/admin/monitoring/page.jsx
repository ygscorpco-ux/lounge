"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}:${ss}`;
}

function formatMs(value) {
  if (!Number.isFinite(Number(value))) return "-";
  return `${Math.round(Number(value))}ms`;
}

const HOURS_OPTIONS = [1, 3, 6, 12, 24, 48, 72, 168];

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [hours, setHours] = useState(24);
  const [eventType, setEventType] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("hours", String(hours));
      query.set("limit", "140");
      if (eventType) query.set("eventType", eventType);

      const response = await fetch(`/api/admin/monitoring?${query.toString()}`);
      if (!response.ok) {
        setData(null);
        setLoading(false);
        return;
      }
      const payload = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      setData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [hours, eventType]);

  const summaryItems = useMemo(() => {
    const totals = data?.totals || {};
    const byType = totals.byType || {};
    const bySeverity = totals.bySeverity || {};
    const bySource = totals.bySource || {};

    return [
      { label: "\uC804\uCCB4 \uC774\uBCA4\uD2B8", value: Object.values(byType).reduce((a, b) => a + b, 0) },
      { label: "\uB290\uB9B0 API", value: byType.slow_api || 0 },
      { label: "\uC11C\uBC84 \uC5D0\uB7EC", value: byType.server_error || 0 },
      { label: "Web Vitals", value: byType.web_vitals || 0 },
      { label: "\uACBD\uACE0", value: bySeverity.warning || 0 },
      { label: "\uC5D0\uB7EC", value: bySeverity.error || 0 },
      { label: "API \uC18C\uC2A4", value: bySource.api || 0 },
      { label: "WEB \uC18C\uC2A4", value: bySource.web || 0 },
    ];
  }, [data]);

  return (
    <div className="admin-page">
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.push("/admin")}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="top-bar-title">{"\uBAA8\uB2C8\uD130\uB9C1 \uB300\uC2DC\uBCF4\uB4DC"}</span>
      </div>

      <div className="admin-section">
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <select
            className="sort-select"
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
          >
            {HOURS_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {`${hour}\uC2DC\uAC04`}
              </option>
            ))}
          </select>

          <select
            className="sort-select"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          >
            <option value="">{"\uC804\uCCB4 \uD0C0\uC785"}</option>
            <option value="slow_api">slow_api</option>
            <option value="server_error">server_error</option>
            <option value="web_vitals">web_vitals</option>
          </select>

          <button className="admin-btn" onClick={load} disabled={loading}>
            {"\uC0C8\uB85C\uACE0\uCE68"}
          </button>
        </div>

        {loading && <div className="loading">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</div>}

        {!loading && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid #e8ebf1",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#8a95a5", marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2732" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#273041" }}>
              {"\uB290\uB9B0 API TOP"}
            </div>
            {(data?.slowRoutes || []).length === 0 ? (
              <div style={{ fontSize: 12, color: "#9aa3b1", marginBottom: 14 }}>
                {"\uAE30\uB85D \uC5C6\uC74C"}
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                {(data?.slowRoutes || []).map((route) => (
                  <div
                    key={route.name}
                    style={{
                      border: "1px solid #eceff5",
                      borderRadius: 10,
                      padding: "9px 10px",
                      marginBottom: 6,
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2d3645" }}>
                      {route.name}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#7f8896" }}>
                      {`\uD69F\uC218 ${route.count} | avg ${formatMs(route.avgDurationMs)} | max ${formatMs(route.maxDurationMs)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#273041" }}>
              {"\uCD5C\uC2E0 \uC774\uBCA4\uD2B8"}
            </div>
            {(data?.events || []).length === 0 ? (
              <div style={{ fontSize: 12, color: "#9aa3b1" }}>{"\uC774\uBCA4\uD2B8 \uC5C6\uC74C"}</div>
            ) : (
              (data?.events || []).map((event) => (
                <div
                  key={event.id}
                  style={{
                    border: "1px solid #eceff5",
                    borderRadius: 10,
                    padding: "10px 10px",
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#1f2732" }}>
                      {`${event.eventType} / ${event.name}`}
                    </div>
                    <div style={{ fontSize: 11, color: "#97a0ae" }}>
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>

                  <div style={{ marginTop: 4, fontSize: 12, color: "#667284" }}>
                    {`${event.severity} | ${event.source}${event.path ? ` | ${event.path}` : ""}${
                      event.durationMs !== null ? ` | ${formatMs(event.durationMs)}` : ""
                    }`}
                  </div>

                  {event.message && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "#3c4658" }}>
                      {event.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
