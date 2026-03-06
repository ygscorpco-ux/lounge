"use client";
import { useRouter } from "next/navigation";

export default function WriteButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/post/write")}
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "max(env(safe-area-inset-bottom), 18px)",
        height: "58px",
        minWidth: "196px",
        padding: "0 30px",
        borderRadius: "999px",
        border: "1px solid #d9d9d9",
        background: "#ffffff",
        color: "#30343b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        zIndex: 90,
        fontSize: "18px",
        fontWeight: 700,
        letterSpacing: "-0.2px",
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ef3b3b" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
      </svg>
      <span>{"\uAE00 \uC4F0\uAE30"}</span>
    </button>
  );
}
