"use client";

function LoadingBlock({ height, radius = 16, width = "100%" }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: `${radius}px`,
        background:
          "linear-gradient(90deg, rgba(226,232,240,0.9) 0%, rgba(241,245,249,1) 50%, rgba(226,232,240,0.9) 100%)",
        backgroundSize: "200% 100%",
        animation: "toolPagePulse 1.2s ease-in-out infinite",
      }}
    />
  );
}

export default function ToolPageLoading() {
  return (
    <>
      <style jsx global>{`
        @keyframes toolPagePulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "14px 14px 80px",
          background: "var(--color-bg)",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "18px",
            border: "1px solid #e6edf5",
            boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
            marginBottom: "14px",
          }}
        >
          <LoadingBlock height={18} width="38%" radius={9} />
          <div style={{ marginTop: "12px" }}>
            <LoadingBlock height={12} width="72%" radius={6} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <LoadingBlock height={86} radius={20} />
            <LoadingBlock height={86} radius={20} />
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "18px",
            border: "1px solid #e6edf5",
            boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
            marginBottom: "14px",
          }}
        >
          <LoadingBlock height={18} width="32%" radius={9} />
          <div style={{ marginTop: "12px" }}>
            <LoadingBlock height={12} width="56%" radius={6} />
          </div>
          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <LoadingBlock height={56} radius={18} />
            <LoadingBlock height={56} radius={18} />
            <LoadingBlock height={56} radius={18} />
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "18px",
            border: "1px solid #e6edf5",
            boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
          }}
        >
          <LoadingBlock height={18} width="28%" radius={9} />
          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <LoadingBlock height={64} radius={18} />
            <LoadingBlock height={64} radius={18} />
            <LoadingBlock height={64} radius={18} />
          </div>
        </div>
      </div>
    </>
  );
}
