"use client";

import { useRouter } from "next/navigation";
import DeliveryMarginCalculator from "../../../components/tools/DeliveryMarginCalculator.jsx";
import ToolHeader from "../../../components/tools/ToolHeader.jsx";

export default function DeliveryMarginPage() {
  const router = useRouter();

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100dvh" }}>
      <div className="top-bar">
        <button type="button" className="top-bar-back" onClick={() => router.back()}>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="top-bar-title">실마진 계산기</span>
      </div>
      <ToolHeader
        icon={
          <svg
            viewBox="0 0 28 28"
            width="24"
            height="24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="3" width="18" height="22" rx="4" />
            <path d="M9 8h10M9 12h4M9 16h10M9 20h6" />
            <path d="M19 11.5h.01M15 11.5h.01" />
          </svg>
        }
        title="실마진 계산기"
        badge="실시간 반영"
      />
      <DeliveryMarginCalculator />
    </div>
  );
}
