"use client";

/**
 * ToolHeader — 사장님 도구 공통 상단 헤더
 * props:
 *   icon    : SVG 요소 (ReactNode)
 *   title   : 타이틀 문자열
 *   sub     : 부제목 문자열
 *   badge   : 오른쪽 보조 뱃지 문자열 (선택)
 *   gradient: 하위 호환용, 현재는 사용하지 않음
 */
export default function ToolHeader({ icon, title, sub, note, badge }) {
  return (
    <div
      style={{
        padding: "12px 14px 0",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top right, rgba(27,71,151,0.11), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)",
          border: "1px solid #e3ebf4",
          borderRadius: "28px",
          padding: "18px",
          boxShadow:
            "0 14px 30px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "18px",
                background: "#1b4797",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 12px 22px rgba(27,71,151,0.16)",
              }}
            >
              {icon}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  letterSpacing: "-0.04em",
                }}
              >
                {title}
              </div>
              {sub && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#5f6c80",
                    lineHeight: 1.55,
                    marginTop: "6px",
                  }}
                >
                  {sub}
                </div>
              )}
              {note && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#8c99ac",
                    lineHeight: 1.5,
                    marginTop: "5px",
                  }}
                >
                  {note}
                </div>
              )}
            </div>
          </div>

          {badge ? (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#1b4797",
                background: "rgba(27,71,151,0.08)",
                border: "1px solid rgba(27,71,151,0.12)",
                borderRadius: "999px",
                padding: "5px 10px",
                flexShrink: 0,
                lineHeight: 1.5,
                textAlign: "center",
                whiteSpace: "pre",
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
