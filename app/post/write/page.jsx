"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const scrollRef = useRef(null); // 스크롤 영역 ref — pull-to-refresh 제어용
  const router = useRouter();

  // iOS Safari pull-to-refresh 방지 — CSS만으론 iOS에서 안 됨, JS로 터치 이벤트 직접 차단
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;

    const onTouchStart = (e) => {
      startY = e.touches[0].clientY; // 터치 시작 Y좌표 기록
    };

    const onTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      // 스크롤이 맨 위에 있고, 아래로 당기는 동작이면 → 브라우저 기본동작(새로고침) 차단
      if (el.scrollTop === 0 && currentY > startY) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false }); // passive:false 여야 preventDefault 가능

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        if (data && data.user && data.user.role === "admin") setIsAdmin(true);
      });
  }, []);

  // 내용 입력할 때마다 textarea 높이를 내용에 맞게 자동 확장
  function handleContentChange(e) {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "자유",
        title,
        content,
        isNotice: isAdmin ? isNotice : false,
      }),
    });

    const data = await res.json();
    if (res.ok) router.push("/");
    else setError(data.error || "작성 실패");
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        height:
          "100vh" /* 100%는 모바일에서 불안정 → 뷰포트 높이를 명확히 지정 */,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        zIndex: 200,
      }}
    >
      {/* ✅ 고정 상단바 — 절대 안 움직임 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#333" }}>
          글 쓰기
        </span>
        <button
          onClick={handleSubmit}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            color: title.trim() && content.trim() ? "#1b4797" : "#ccc",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          완료
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 16px",
            background: "#fff5f5",
            color: "#e53e3e",
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* ✅ 스크롤 영역 — 헤더 아래 전체가 스크롤됨 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain", /* Android Chrome용 pull-to-refresh 차단 */
        }}
      >
        {/* 관리자 공지 옵션 */}
        {isAdmin && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "14px",
              color: "#333",
            }}
          >
            <input
              type="checkbox"
              checked={isNotice}
              onChange={(e) => setIsNotice(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#1b4797" }}
            />
            공지로 등록
          </label>
        )}

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목을 입력해주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "18px 16px 14px",
            border: "none",
            borderBottom: "1px solid #f0f0f0",
            fontSize: "18px",
            fontWeight: 600,
            color: "#1a1a1a",
            outline: "none",
            background: "transparent",
            boxSizing: "border-box",
          }}
        />

        {/* ✅ 핵심 수정: textarea는 flex:1 없이, 내용 길이만큼 자동으로 키가 늘어남 */}
        <textarea
          ref={textareaRef}
          placeholder={
            "염광사 회원님들과 자유롭게 얘기해보세요.\n#매출고민 #직원관리 #운영노하우"
          }
          value={content}
          onChange={handleContentChange}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            border: "none",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#333",
            outline: "none",
            resize: "none",
            overflow: "hidden" /* ← textarea 자체 스크롤 완전 제거 */,
            background: "transparent",
            minHeight: "240px" /* ← 최소 높이 확보 */,
            boxSizing: "border-box",
          }}
        />

        {/* 이용규칙 — 내용이 길어지면 자연스럽게 아래로 밀려남 */}
        <div style={{ padding: "20px 16px 32px" }}>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#bbb",
                lineHeight: 1.8,
                marginBottom: "10px",
              }}
            >
              커뮤니티 이용규칙에 의해 정해진 게시물 게재 제한을 위반할 경우,
              게시물이 삭제되고 서비스 이용이 일정 기간 제한될 수 있습니다.
            </p>
            <p style={{ fontSize: "11px", color: "#ccc", lineHeight: 1.7 }}>
              · 광고/홍보 목적의 게시물 작성 금지
              <br />
              · 정치·사회적 의견, 주장을 드러내는 행위 금지
              <br />
              · 욕설, 비하, 차별, 혐오, 음란물 등 불쾌감을 주는 행위 금지
              <br />
              · 타인의 권리를 침해하는 행위 금지
              <br />· 불법촬영물 유통 시 관련 법률에 의거 처벌
            </p>
            <button
              onClick={() => router.push("/rules")}
              style={{
                background: "none",
                border: "none",
                padding: "0",
                fontSize: "11px",
                color: "#bbb",
                cursor: "pointer",
                marginTop: "8px",
                textDecoration: "underline",
              }}
            >
              커뮤니티 이용규칙 전체 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
