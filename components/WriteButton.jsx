"use client";
import { useRouter } from "next/navigation";

export default function WriteButton() {
  const router = useRouter();

  return (
    <button
      data-testid="write-button"
      onClick={() => router.push("/post/write")}
      style={{
        position: "fixed",
        right: "16px",
        bottom: "max(env(safe-area-inset-bottom), 14px)",
        height: "48px",
        minWidth: "130px",
        padding: "0 18px",
        borderRadius: "999px",
        border: "1px solid #d9d9d9",
        background: "#ffffff",
        color: "#30343b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        zIndex: 90,
        fontSize: "16px",
        fontWeight: 700,
        letterSpacing: "-0.2px",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="#1b4797"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
      </svg>
      <span>{"\uAE00 \uC4F0\uAE30"}</span>
    </button>
  );
}
