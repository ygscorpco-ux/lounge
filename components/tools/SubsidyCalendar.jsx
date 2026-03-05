"use client";
import { useState, useEffect, useMemo } from "react";

// 카테고리 설정
const CATEGORIES = [
  { id: "전체", label: "전체", color: "#495057", bg: "#f4f6fb" },
  { id: "자금지원", label: "💰 자금지원", color: "#1b4797", bg: "#eef2fb" },
  { id: "교육", label: "📚 교육", color: "#2ecc71", bg: "#f0faf4" },
  { id: "컨설팅", label: "🤝 컨설팅", color: "#f39c12", bg: "#fff8ec" },
  { id: "세금혜택", label: "🏦 세금혜택", color: "#e74c3c", bg: "#fff0f0" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 오늘 기준 D-day 계산
function getDday(endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / 86400000);
}

// D-day 뱃지 스타일
function DdayBadge({ endDate, small = false }) {
  const d = getDday(endDate);
  let bg, color, border, text;
  if (d < 0) {
    bg = "#f0f0f0";
    color = "#aaa";
    border = "#ddd";
    text = "마감";
  } else if (d === 0) {
    bg = "#fff0f0";
    color = "#e74c3c";
    border = "#e74c3c";
    text = "D-Day";
  } else if (d <= 7) {
    bg = "#fff0f0";
    color = "#e74c3c";
    border = "#e74c3c";
    text = `D-${d}`;
  } else if (d <= 30) {
    bg = "#fff8e1";
    color = "#f39c12";
    border = "#f39c12";
    text = `D-${d}`;
  } else {
    bg = "#eef2fb";
    color = "#1b4797";
    border = "#b8ccf0";
    text = `D-${d}`;
  }
  return (
    <span
      style={{
        padding: small ? "2px 7px" : "4px 10px",
        borderRadius: "20px",
        fontSize: small ? "10px" : "12px",
        fontWeight: 700,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {text}
    </span>
  );
}

// 달력 그리드 생성 (일~토 기준)
function buildGrid(year, month) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

// 바텀 시트 컴포넌트
function BottomSheet({ open, onClose, onSubmit }) {
  const EMPTY = {
    title: "",
    category: "자금지원",
    start_date: "",
    end_date: "",
    target: "",
    description: "",
    url: "",
    amount: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setErr("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!form.title || !form.end_date) {
      setErr("제목과 마감일은 필수입니다");
      return;
    }
    setSaving(true);
    const r = await fetch("/api/subsidy/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (d.success) {
      onSubmit();
      onClose();
    } else setErr(d.error || "등록 실패");
  }

  const inp = (field, props = {}) => (
    <input
      value={form[field]}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: "14px",
        border: "1.5px solid var(--color-gray-300)",
        borderRadius: "8px",
        outline: "none",
        fontFamily: "inherit",
        marginBottom: "10px",
      }}
      {...props}
    />
  );

  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 300,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 40px",
          zIndex: 400,
          animation: "slideUp 0.25s ease",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        {/* 핸들 */}
        <div
          style={{
            width: "40px",
            height: "4px",
            borderRadius: "2px",
            background: "#ddd",
            margin: "0 auto 18px",
          }}
        />
        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "var(--color-gray-900)",
          }}
        >
          지원금 등록
        </div>
        {err && (
          <div
            style={{
              padding: "10px 12px",
              background: "#fff0f0",
              color: "var(--color-danger)",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            {err}
          </div>
        )}

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          제목 *
        </div>
        {inp("title", { placeholder: "예) 소상공인 경영안정자금 신청" })}

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          카테고리 *
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: "14px",
            border: "1.5px solid var(--color-gray-300)",
            borderRadius: "8px",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: "10px",
            background: "#fff",
          }}
        >
          {CATEGORIES.filter((c) => c.id !== "전체").map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-gray-700)",
                marginBottom: "5px",
              }}
            >
              신청 시작일
            </div>
            {inp("start_date", { type: "date" })}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-gray-700)",
                marginBottom: "5px",
              }}
            >
              마감일 *
            </div>
            {inp("end_date", { type: "date" })}
          </div>
        </div>

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          신청 대상
        </div>
        {inp("target", { placeholder: "예) 소상공인 전체" })}

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          지원금액
        </div>
        {inp("amount", { placeholder: "예) 최대 400만원" })}

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          설명
        </div>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="지원사업 상세 설명"
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: "14px",
            border: "1.5px solid var(--color-gray-300)",
            borderRadius: "8px",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: "10px",
            resize: "vertical",
          }}
        />

        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-gray-700)",
            marginBottom: "5px",
          }}
        >
          신청 링크 URL
        </div>
        {inp("url", { placeholder: "https://..." })}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: "4px",
          }}
        >
          {saving ? "등록 중..." : "등록하기"}
        </button>
      </div>
    </>
  );
}

// 북마크 로드/저장 헬퍼
function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem("subsidyBookmarks") || "[]");
  } catch {
    return [];
  }
}
function saveBookmarks(ids) {
  localStorage.setItem("subsidyBookmarks", JSON.stringify(ids));
}

// AI 지원금 맞춤 추천 섹션
function SubsidyAiSection({ onRecommend }) {
  const [form, setForm] = useState({
    industry: "",
    region: "",
    businessYears: "",
    employeeCount: "",
    monthlyRevenueRange: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const INDUSTRIES = ["카페", "치킨", "피자", "한식", "분식", "중식", "기타"];
  const REVENUES = [
    "500만원 미만",
    "500~1000만원",
    "1000~3000만원",
    "3000만원 이상",
  ];

  async function handleRecommend() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tools/subsidy-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: form.industry,
          region: form.region,
          businessYears: parseInt(form.businessYears) || 0,
          employeeCount: parseInt(form.employeeCount) || 0,
          monthlyRevenueRange: form.monthlyRevenueRange,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "추천 실패");
    } catch {
      setError("네트워크 오류");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "16px",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-gray-200)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🎯</span>
          <div style={{ textAlign: "left" }}>
            <div
              style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}
            >
              AI 맞춤 지원금 추천
            </div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>
              프로필 입력 → 내게 맞는 TOP 3 추천
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: "16px",
            color: "#888",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ marginTop: "14px", animation: "slideUp 0.2s ease" }}>
          {/* 업종 선택 */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#495057",
              marginBottom: "8px",
            }}
          >
            업종
          </div>
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    industry: ind === f.industry ? "" : ind,
                  }))
                }
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border:
                    form.industry === ind
                      ? "1.5px solid var(--color-primary)"
                      : "1.5px solid #ddd",
                  background:
                    form.industry === ind ? "var(--color-primary)" : "#fff",
                  color: form.industry === ind ? "#fff" : "#666",
                  cursor: "pointer",
                }}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* 지역 + 업력 */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 2 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#495057",
                  marginBottom: "5px",
                }}
              >
                지역
              </div>
              <input
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                placeholder="예) 서울 강남구"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "13px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#495057",
                  marginBottom: "5px",
                }}
              >
                업력(년)
              </div>
              <input
                value={form.businessYears}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessYears: e.target.value }))
                }
                type="number"
                placeholder="3"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "13px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#495057",
                  marginBottom: "5px",
                }}
              >
                직원수
              </div>
              <input
                value={form.employeeCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employeeCount: e.target.value }))
                }
                type="number"
                placeholder="2"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "13px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* 월매출 */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#495057",
              marginBottom: "6px",
            }}
          >
            월 매출
          </div>
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            {REVENUES.map((r) => (
              <button
                key={r}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    monthlyRevenueRange: r === f.monthlyRevenueRange ? "" : r,
                  }))
                }
                style={{
                  padding: "5px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border:
                    form.monthlyRevenueRange === r
                      ? "1.5px solid var(--color-primary)"
                      : "1.5px solid #ddd",
                  background:
                    form.monthlyRevenueRange === r
                      ? "var(--color-primary)"
                      : "#fff",
                  color: form.monthlyRevenueRange === r ? "#fff" : "#666",
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleRecommend}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #1b4797 0%, #4f80e1 100%)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "AI 분석 중..." : "🎯 맞춤 지원금 추천받기"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#fff0f0",
                color: "#e74c3c",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {result?.recommendations?.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              {result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    marginBottom: "8px",
                    background: i === 0 ? "#eef2fb" : "#f8f9fa",
                    border: `1.5px solid ${i === 0 ? "var(--color-primary)" : "#ddd"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: i === 0 ? "var(--color-primary)" : "#555",
                      }}
                    >
                      {["🥇", "🥈", "🥉"][i]} {rec.title}
                    </span>
                    {rec.urgency && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "8px",
                          marginLeft: "auto",
                          fontWeight: 700,
                          background:
                            rec.urgency === "높음" ? "#fff0f0" : "#f0f8ff",
                          color: rec.urgency === "높음" ? "#e74c3c" : "#1b4797",
                        }}
                      >
                        긴급도: {rec.urgency}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#555",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {rec.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
          {result && (
            <p
              style={{
                fontSize: "10px",
                color: "#6c757d",
                marginTop: "10px",
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              ⚠️ AI 추천은 입력 정보 기반 참고용이에요. 실제 신청 자격은 각 기관
              공고문을 확인하세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubsidyCalendar() {
  const today = new Date();
  const [view, setView] = useState("list"); // 기본 뷰: 리스트 (전체 지원금 바로 확인)
  const [fetchError, setFetchError] = useState("");
  const [category, setCategory] = useState("전체");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]); // 북마크 지원금 ID 배열
  const [showBookmarkOnly, setShowBookmarkOnly] = useState(false);

  // 북마크 초기 로드
  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  }

  // 로그인 유저 확인
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setUser(d.user);
      });
  }, []);

  // 지원금 데이터 불러오기 — 월 필터 없이 전체 조회 (마감 포함)
  async function loadSubsidies() {
    setLoading(true);
    setFetchError("");
    try {
      // year/month 파라미터 제거 → API가 전체 활성 지원금 반환
      const r = await fetch(
        `/api/subsidy/list?category=${encodeURIComponent(category)}`,
      );
      const d = await r.json();
      if (d.success) setSubsidies(d.data);
      else setFetchError(d.error || "데이터를 불러오지 못했습니다");
    } catch (e) {
      setFetchError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSubsidies();
  }, [category]); // year/month 제거 — 카테고리 바뀔 때만 재조회

  // 캘린더 그리드
  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  // 날짜별 지원금 그룹핑 (마감일 기준)
  const subsidyByDay = useMemo(() => {
    const map = {};
    subsidies.forEach((s) => {
      const day = parseInt(s.end_date.slice(8, 10));
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [subsidies]);

  // 선택 날짜의 지원금
  const selectedSubsidies = useMemo(() => {
    if (!selectedDate) return [];
    return subsidies.filter(
      (s) => s.end_date.slice(8, 10) === String(selectedDate).padStart(2, "0"),
    );
  }, [selectedDate, subsidies]);

  // 리스트 뷰: D-day 임박 순 정렬, 마감 항목은 뒤로
  const sortedList = useMemo(() => {
    return [...subsidies].sort((a, b) => {
      const da = getDday(a.end_date),
        db = getDday(b.end_date);
      if (da < 0 && db >= 0) return 1;
      if (db < 0 && da >= 0) return -1;
      return da - db;
    });
  }, [subsidies]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function handleDayClick(day) {
    if (!day || !subsidyByDay[day]) return;
    setSelectedDate(selectedDate === day ? null : day);
  }

  const isToday = (day) =>
    day &&
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day;

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "20px 16px 80px",
        background: "var(--color-bg)",
      }}
    >
      {/* ── 헤더 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
            <rect
              x="4"
              y="8"
              width="32"
              height="30"
              rx="4"
              stroke="#1b4797"
              strokeWidth="2.4"
              fill="#eef2fb"
            />
            <path d="M4 17h32" stroke="#1b4797" strokeWidth="2.2" />
            <path
              d="M14 8V5M26 8V5"
              stroke="#1b4797"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M10 24h4M10 30h4M18 24h4"
              stroke="#4f80e1"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="36"
              cy="36"
              r="10"
              fill="#eef2fb"
              stroke="#1b4797"
              strokeWidth="2.2"
            />
            <path
              d="M36 30v6l3 3"
              stroke="#4f80e1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-gray-900)",
                lineHeight: 1.2,
              }}
            >
              지원금 캘린더
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-gray-500)",
                marginTop: "3px",
              }}
            >
              놓치면 아까운 소상공인 지원사업
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-primary)",
            background: "var(--color-primary-bg)",
            borderRadius: "8px",
            padding: "6px 12px",
            flexShrink: 0,
          }}
        >
          {year}년 {month}월
        </div>
      </div>

      {/* ── AI 맞춤 추천 ── */}
      <SubsidyAiSection />

      {/* ── 에러 배너 ── */}
      {fetchError && (
        <div
          style={{
            padding: "11px 14px",
            background: "#fff0f0",
            color: "var(--color-danger)",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {fetchError}</span>
          <button
            onClick={loadSubsidies}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-danger)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            재시도
          </button>
        </div>
      )}

      {/* ── 뷰 탭 ── */}
      <div
        style={{
          display: "flex",
          background: "var(--color-gray-100)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "16px",
        }}
      >
        {[
          { id: "calendar", label: "📅 캘린더" },
          { id: "list", label: "📋 리스트" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
              transition: "all 0.2s",
              background:
                view === t.id ? "var(--color-primary)" : "transparent",
              color: view === t.id ? "#fff" : "var(--color-gray-700)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 카테고리 필터 ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: "4px",
          marginBottom: "16px",
        }}
      >
        {CATEGORIES.map((c) => {
          const sel = category === c.id && !showBookmarkOnly;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id);
                setSelectedDate(null);
                setShowBookmarkOnly(false);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                flexShrink: 0,
                fontSize: "13px",
                fontWeight: sel ? 700 : 500,
                border: sel
                  ? `1.5px solid ${c.color}`
                  : "1.5px solid var(--color-gray-300)",
                background: sel ? c.color : "#fff",
                color: sel ? "#fff" : "var(--color-gray-700)",
                transition: "all 0.15s",
              }}
            >
              {c.label}
            </button>
          );
        })}
        {/* 북마크 탭 */}
        <button
          onClick={() => {
            setShowBookmarkOnly((v) => !v);
            setCategory("전체");
            setSelectedDate(null);
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            cursor: "pointer",
            flexShrink: 0,
            fontSize: "13px",
            fontWeight: showBookmarkOnly ? 700 : 500,
            border: showBookmarkOnly
              ? "1.5px solid #f39c12"
              : "1.5px solid var(--color-gray-300)",
            background: showBookmarkOnly ? "#f39c12" : "#fff",
            color: showBookmarkOnly ? "#fff" : "var(--color-gray-700)",
            transition: "all 0.15s",
          }}
        >
          ⭐ 관심 {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}
        </button>
      </div>

      {/* ── 캘린더 뷰 ── */}
      {view === "calendar" && (
        <div>
          {/* 로딩 스켈레톤 */}
          {loading && (
            <div
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "18px",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-gray-200)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: "4px",
                  marginTop: "46px",
                }}
              >
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "8px",
                      animation: "shimmer 1.2s infinite",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              display: loading ? "none" : "block",
              background: "#fff",
              borderRadius: "20px",
              padding: "18px",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--color-gray-200)",
              marginBottom: "12px",
            }}
          >
            {/* 월 이동 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <button
                onClick={prevMonth}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "var(--color-gray-100)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ‹
              </button>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--color-gray-900)",
                }}
              >
                {year}년 {month}월
              </span>
              <button
                onClick={nextMonth}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "var(--color-gray-100)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ›
              </button>
            </div>

            {/* 요일 헤더 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                marginBottom: "6px",
              }}
            >
              {WEEK_DAYS.map((d, i) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 0",
                    color:
                      i === 0
                        ? "var(--color-danger)"
                        : i === 6
                          ? "var(--color-accent)"
                          : "var(--color-gray-500)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 셀 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: "2px",
              }}
            >
              {grid.map((day, idx) => {
                // null 셀 (달 앞/뒤 빈 칸) — 완전히 빈 div만 렌더링
                if (!day) return <div key={idx} style={{ aspectRatio: "1" }} />;

                const dow = idx % 7;
                const hasSub = subsidyByDay[day];
                const dots = hasSub ? hasSub.slice(0, 3) : [];
                const isSelected = day === selectedDate;
                const isTod = isToday(day);
                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "3px",
                      borderRadius: "10px",
                      cursor: hasSub ? "pointer" : "default",
                      background: isSelected
                        ? "var(--color-primary)"
                        : isTod
                          ? "var(--color-primary-bg)"
                          : "transparent",
                      border:
                        isTod && !isSelected
                          ? "2px solid var(--color-primary)"
                          : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected || isTod ? 700 : 400,
                        lineHeight: 1,
                        color: isSelected
                          ? "#fff"
                          : dow === 0
                            ? "var(--color-danger)"
                            : dow === 6
                              ? "var(--color-accent)"
                              : "var(--color-gray-900)",
                      }}
                    >
                      {day}
                    </span>
                    {dots.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "2px",
                          justifyContent: "center",
                        }}
                      >
                        {dots.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: isSelected
                                ? "rgba(255,255,255,0.8)"
                                : CAT_MAP[s.category]?.color || "#1b4797",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 선택 날짜 지원금 슬라이드업 */}
          {selectedDate && selectedSubsidies.length > 0 && (
            <div style={{ animation: "slideUp 0.2s ease" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--color-gray-700)",
                  marginBottom: "8px",
                  paddingLeft: "4px",
                }}
              >
                {month}월 {selectedDate}일 마감 지원금
              </div>
              {selectedSubsidies.map((s) => {
                const cat = CAT_MAP[s.category] || CAT_MAP["자금지원"];
                return (
                  <div
                    key={s.id}
                    style={{
                      background: "#fff",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      marginBottom: "8px",
                      boxShadow: "var(--shadow-sm)",
                      borderLeft: `4px solid ${cat.color}`,
                      border: `1px solid var(--color-gray-200)`,
                      borderLeftWidth: "4px",
                      borderLeftColor: cat.color,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: cat.color,
                          background: cat.bg,
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {s.category}
                      </span>
                      <DdayBadge endDate={s.end_date} small />
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--color-gray-900)",
                        marginBottom: "4px",
                      }}
                    >
                      {s.title}
                    </div>
                    {s.amount && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--color-primary)",
                          fontWeight: 600,
                        }}
                      >
                        💰 {s.amount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 이번 달 지원금 없을 때 */}
          {!loading && subsidies.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px",
                color: "var(--color-gray-500)",
                fontSize: "14px",
              }}
            >
              이번 달 등록된 지원금이 없습니다
            </div>
          )}
        </div>
      )}

      {/* ── 리스트 뷰 ── */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading &&
            // 로딩 스켈레톤
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                  borderLeft: "4px solid var(--color-gray-200)",
                }}
              >
                <div
                  style={{
                    height: "14px",
                    width: "80px",
                    borderRadius: "6px",
                    marginBottom: "10px",
                    animation: "shimmer 1.2s infinite",
                  }}
                />
                <div
                  style={{
                    height: "18px",
                    width: "70%",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    animation: "shimmer 1.2s infinite",
                  }}
                />
                <div
                  style={{
                    height: "13px",
                    width: "50%",
                    borderRadius: "6px",
                    animation: "shimmer 1.2s infinite",
                  }}
                />
              </div>
            ))}
          {!loading &&
            sortedList.filter(
              (s) => !showBookmarkOnly || bookmarks.includes(s.id),
            ).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "var(--color-gray-500)",
                  fontSize: "14px",
                }}
              >
                {showBookmarkOnly
                  ? "북마크한 지원금이 없습니다 ⭐"
                  : "등록된 지원금이 없습니다"}
              </div>
            )}
          {sortedList
            .filter((s) => !showBookmarkOnly || bookmarks.includes(s.id))
            .map((s) => {
              const cat = CAT_MAP[s.category] || CAT_MAP["자금지원"];
              const dday = getDday(s.end_date);
              const expired = dday < 0;
              const urgent = dday >= 0 && dday <= 7; // D-7 이내 = 긴급
              const isBookmarked = bookmarks.includes(s.id);
              return (
                <div
                  key={s.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "18px",
                    boxShadow: urgent
                      ? "0 0 0 2px #e74c3c40"
                      : "var(--shadow-sm)",
                    border: `1px solid ${urgent ? "#e74c3c40" : "var(--color-gray-200)"}`,
                    opacity: expired ? 0.45 : 1,
                    borderLeft: `4px solid ${cat.color}`,
                    animation:
                      urgent && !expired ? "pulseUrgent 2s infinite" : "none",
                    position: "relative",
                  }}
                >
                  {/* 뱃지 줄 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: cat.color,
                        background: cat.bg,
                        padding: "3px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      {s.category}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {/* 북마크 버튼 */}
                      <button
                        onClick={() => toggleBookmark(s.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "2px",
                          lineHeight: 1,
                          opacity: isBookmarked ? 1 : 0.3,
                          transition: "opacity 0.15s, transform 0.15s",
                        }}
                      >
                        ⭐
                      </button>
                      <DdayBadge endDate={s.end_date} />
                    </div>
                  </div>

                  {/* 제목 */}
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--color-gray-900)",
                      marginBottom: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.title}
                  </div>

                  {/* 신청기간 + 대상 */}
                  {(s.start_date || s.end_date) && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-500)",
                        marginBottom: "4px",
                      }}
                    >
                      📅 신청기간:{" "}
                      {s.start_date
                        ? `${s.start_date.slice(5).replace("-", ".")} ~ `
                        : ""}
                      {s.end_date.slice(5).replace("-", ".")}
                    </div>
                  )}
                  {s.target && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-500)",
                        marginBottom: "4px",
                      }}
                    >
                      👥 대상: {s.target}
                    </div>
                  )}
                  {s.amount && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      💰 {s.amount}
                    </div>
                  )}

                  {/* 설명 */}
                  {s.description && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-gray-700)",
                        lineHeight: 1.6,
                        marginBottom: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--color-gray-200)",
                      }}
                    >
                      {s.description}
                    </div>
                  )}

                  {/* 버튼 */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: s.description ? "0" : "12px",
                    }}
                  >
                    {(s.apply_url || s.url) ? (
                      <a
                        href={s.apply_url || s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "10px",
                          textAlign: "center",
                          background: "var(--color-primary)",
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        신청하기 ↗
                      </a>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "10px",
                          textAlign: "center",
                          background: "var(--color-gray-100)",
                          color: "var(--color-gray-500)",
                          fontSize: "13px",
                        }}
                      >
                        링크 없음
                      </div>
                    )}
                    {/* 관리자 삭제 */}
                    {user?.role === "admin" && (
                      <button
                        onClick={async () => {
                          if (!confirm("삭제하시겠습니까?")) return;
                          const delRes = await fetch(`/api/subsidy/${s.id}`, {
                            method: "DELETE",
                          });
                          const delData = await delRes.json();
                          if (delData.success) loadSubsidies();
                          else alert(delData.error || "삭제에 실패했습니다");
                        }}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#fff0f0",
                          color: "var(--color-danger)",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── 더 많은 지원사업 찾기 링크 섹션 ── */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid var(--color-gray-200)",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-gray-700)",
            marginBottom: "12px",
          }}
        >
          더 많은 지원사업 찾기
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {[
            {
              icon: "🏢",
              name: "기업마당",
              desc: "중소기업·소상공인 지원사업 통합공고",
              url: "https://www.bizinfo.go.kr",
              color: "#1b4797",
            },
            {
              icon: "🏪",
              name: "소상공인마당",
              desc: "소진공 공식 지원사업 신청",
              url: "https://www.sbiz.or.kr",
              color: "#2ecc71",
            },
            {
              icon: "🏛️",
              name: "중소벤처기업부",
              desc: "정책자금·창업지원 공고",
              url: "https://www.mss.go.kr",
              color: "#f39c12",
            },
            {
              icon: "📋",
              name: "고용24",
              desc: "고용보험·일자리 지원사업",
              url: "https://www.work24.go.kr",
              color: "#e74c3c",
            },
          ].map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "14px",
                background: "#fff",
                border: "1.5px solid var(--color-gray-200)",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0 }}>
                {link.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: link.color,
                    marginBottom: "2px",
                  }}
                >
                  {link.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-gray-500)",
                    lineHeight: 1.4,
                  }}
                >
                  {link.desc}
                </div>
              </div>
            </a>
          ))}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-gray-500)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          위 사이트에서 더 많은 지원사업을 확인하세요 ↗
        </div>
      </div>

      {/* ── 관리자 플로팅 버튼 ── */}
      {user?.role === "admin" && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            position: "fixed",
            bottom: "88px",
            right: "20px",
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(27,71,151,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            transition: "transform 0.15s",
          }}
        >
          +
        </button>
      )}

      {/* ── 바텀 시트 등록 모달 ── */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={loadSubsidies}
      />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background: #f0f0f0; }
          50%  { background: #e0e0e0; }
          100% { background: #f0f0f0; }
        }
        @keyframes pulseUrgent {
          0%, 100% { box-shadow: 0 0 0 2px rgba(231,76,60,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(231,76,60,0.08); }
        }
      `}</style>
    </div>
  );
}
