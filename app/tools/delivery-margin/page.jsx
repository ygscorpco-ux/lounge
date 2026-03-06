"use client";

import { useRouter } from "next/navigation";
import DeliveryMarginCalculator from "../../../components/tools/DeliveryMarginCalculator.jsx";

export default function DeliveryMarginPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#f6f8fc", minHeight: "100dvh" }}>
      <div
        className="top-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 120,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <button
          type="button"
          className="top-bar-back"
          aria-label="뒤로 가기"
          onClick={() => router.back()}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#111827"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18L9 12L15 6" />
          </svg>
        </button>
        <span
          className="top-bar-title"
          style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          실마진 계산기
        </span>
      </div>

      <DeliveryMarginCalculator />
    </div>
  );
}
