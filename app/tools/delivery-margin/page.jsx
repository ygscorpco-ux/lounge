"use client";
import { useRouter } from "next/navigation";
import DeliveryMarginCalculator from "../../../components/tools/DeliveryMarginCalculator.jsx";
import ToolHeader from "../../../components/tools/ToolHeader.jsx";

export default function DeliveryMarginPage() {
  const router = useRouter();
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100dvh" }}>
      <div className="top-bar">
        <button className="top-bar-back" onClick={() => router.back()}>
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
            width="28"
            height="28"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="20" r="2" />
            <circle cx="20" cy="20" r="2" />
            <path d="M1 3h3l2.5 11h11l2.5-8H7" />
            <path d="M16 10v5M18 12h-4" />
          </svg>
        }
        title="실마진 계산기"
        sub="메뉴 하나 팔면 실제로 얼마 남을까?"
        note={<>배민 정산서와 다를 수 있어요<br/>이 계산기는 메뉴별 예상 마진을 미리 확인하는 도구예요</>}
        badge={`배민·쿠팡\n요기요·땡겨요`}
      />
      <DeliveryMarginCalculator />
    </div>
  );
}
