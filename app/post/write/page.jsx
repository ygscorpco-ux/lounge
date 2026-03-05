"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  // 이미지 첨부 상태
  const [images, setImages] = useState([]); // 업로드된 이미지 URL 배열
  const [uploading, setUploading] = useState(false);

  // 투표 상태 — null이면 투표 없음, 객체면 투표 작성 중
  const [poll, setPoll] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null); // 숨겨진 파일 입력 ref
  const scrollRef = useRef(null);
  const router = useRouter();

  // iOS Safari pull-to-refresh 방지
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (el.scrollTop === 0 && e.touches[0].clientY > startY)
        e.preventDefault();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
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

  function handleContentChange(e) {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }

  // 이미지 파일 선택 → Cloudinary 업로드
  async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 4) {
      setError("이미지는 최대 4장까지 첨부 가능합니다");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setError(data.error || "이미지 업로드 실패");
      }
    } catch (e) {
      setError("이미지 업로드 중 오류가 발생했습니다");
    }
    setUploading(false);
    e.target.value = ""; // 같은 파일 다시 선택 가능하도록 초기화
  }

  // 업로드된 이미지 제거
  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // 투표 항목 텍스트 변경
  function updatePollOption(idx, value) {
    setPoll((prev) => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });
  }

  // 투표 항목 추가 (최대 4개)
  function addPollOption() {
    if (poll.options.length >= 4) return;
    setPoll((prev) => ({ ...prev, options: [...prev.options, ""] }));
  }

  // 투표 항목 삭제 (최소 2개 유지)
  function removePollOption(idx) {
    if (poll.options.length <= 2) return;
    setPoll((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
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

    // 투표가 있으면 유효성 검사
    if (poll) {
      if (!poll.question.trim()) {
        setError("투표 질문을 입력해주세요");
        return;
      }
      const validOptions = poll.options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        setError("투표 항목을 2개 이상 입력해주세요");
        return;
      }
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "자유",
        title,
        content,
        isNotice: isAdmin ? isNotice : false,
        images, // 업로드된 이미지 URL 배열
        poll: poll
          ? {
              question: poll.question,
              options: poll.options.filter((o) => o.trim()),
            }
          : null,
      }),
    });

    const data = await res.json();
    if (res.ok) router.push("/");
    else setError(data.error || "작성 실패");
  }

  const canSubmit = title.trim() && content.trim() && !uploading;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        zIndex: 200,
      }}
    >
      {/* 상단 헤더 */}
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
          disabled={!canSubmit}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            color: canSubmit ? "#1b4797" : "#ccc",
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "default",
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

      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
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

        {/* 내용 */}
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
            overflow: "hidden",
            background: "transparent",
            minHeight: "200px",
            boxSizing: "border-box",
          }}
        />

        {/* 업로드된 이미지 미리보기 */}
        {images.length > 0 && (
          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {images.map((url, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: "100px",
                  height: "100px",
                }}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #f0f0f0",
                  }}
                />
                {/* 이미지 삭제 버튼 */}
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    color: "#fff",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* 업로드 중 스피너 */}
            {uploading && (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "8px",
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                업로드 중...
              </div>
            )}
          </div>
        )}

        {/* 투표 작성 영역 */}
        {poll && (
          <div
            style={{
              margin: "0 16px 16px",
              borderRadius: "12px",
              border: "1px solid #e8edf5",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#f0f4ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: 700, color: "#1b4797" }}
              >
                📊 투표
              </span>
              <button
                onClick={() => setPoll(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#999",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                삭제
              </button>
            </div>
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* 투표 질문 */}
              <input
                type="text"
                placeholder="투표 질문을 입력하세요"
                value={poll.question}
                onChange={(e) =>
                  setPoll((prev) => ({ ...prev, question: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {/* 투표 항목들 */}
              {poll.options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#999",
                      width: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`항목 ${idx + 1}`}
                    value={opt}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  {poll.options.length > 2 && (
                    <button
                      onClick={() => removePollOption(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ccc",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "0 4px",
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {/* 항목 추가 버튼 (최대 4개) */}
              {poll.options.length < 4 && (
                <button
                  onClick={addPollOption}
                  style={{
                    padding: "9px",
                    border: "1px dashed #c0cde0",
                    borderRadius: "8px",
                    background: "none",
                    fontSize: "13px",
                    color: "#1b4797",
                    cursor: "pointer",
                  }}
                >
                  + 항목 추가
                </button>
              )}
            </div>
          </div>
        )}

        {/* 이용규칙 안내 */}
        <div style={{ padding: "12px 16px 32px" }}>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#bbb",
                lineHeight: 1.8,
                marginBottom: "10px",
              }}
            >
              라운지 이용규칙에 의해 정해진 게시물 게재 제한을 위반할 경우,
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
              라운지 이용규칙 전체 보기
            </button>
          </div>
        </div>
      </div>

      {/* 하단 툴바 — 이미지 첨부 / 투표 추가 버튼 */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid #f0f0f0",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "#fff",
        }}
      >
        {/* 숨겨진 파일 입력 — 버튼 클릭 시 열림 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />

        {/* 이미지 첨부 버튼 */}
        <button
          onClick={() =>
            !uploading && images.length < 4 && fileInputRef.current.click()
          }
          style={{
            background: "none",
            border: "none",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: images.length >= 4 ? "#ccc" : "#555",
          }}
          title="이미지 첨부 (최대 4장)"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {images.length > 0 && (
            <span
              style={{ fontSize: "12px", color: "#1b4797", fontWeight: 600 }}
            >
              {images.length}/4
            </span>
          )}
        </button>

        {/* 투표 추가 버튼 — 투표용지/체크리스트 아이콘 */}
        <button
          onClick={() => !poll && setPoll({ question: "", options: ["", ""] })}
          style={{
            background: "none",
            border: "none",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: poll ? "#1b4797" : "#555",
          }}
          title="투표 추가"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          {poll && (
            <span
              style={{ fontSize: "12px", color: "#1b4797", fontWeight: 600 }}
            >
              투표
            </span>
          )}
        </button>

        {uploading && (
          <span style={{ fontSize: "12px", color: "#999", marginLeft: "4px" }}>
            업로드 중...
          </span>
        )}
      </div>
    </div>
  );
}
