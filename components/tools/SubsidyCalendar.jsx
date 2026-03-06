"use client";
import { useState, useEffect, useMemo } from "react";

// 카테고리 설정
const CATEGORIES = [
  { id: "전체", label: "전체", color: "#495057", bg: "#f4f6fb" },
  { id: "자금지원", label: "자금지원", color: "#1b4797", bg: "#eef2fb" },
  { id: "교육", label: "교육", color: "#2ecc71", bg: "#f0faf4" },
  { id: "컨설팅", label: "컨설팅", color: "#f39c12", bg: "#fff8ec" },
  { id: "세금혜택", label: "세금혜택", color: "#e74c3c", bg: "#fff0f0" },
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

function getApplyStatus(subsidy) {
  const dday = getDday(subsidy.end_date);

  if (dday < 0) {
    return { label: "마감됨", color: "#64748b", bg: "#f1f5f9" };
  }

  if (subsidy.apply_url || subsidy.url) {
    return { label: "바로 신청 가능", color: "#1b4797", bg: "#eef5ff" };
  }

  return { label: "공고 확인 필요", color: "#b45309", bg: "#fff7ed" };
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
        borderRadius: "24px",
        padding: "18px",
        marginBottom: "16px",
        boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
        border: "1px solid #e6edf5",
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
          <div style={{ textAlign: "left" }}>
            <div
              style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}
            >
              AI 맞춤 지원금 추천
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
              업종과 지역 기준으로 지금 볼만한 지원사업을 고릅니다.
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: "14px",
            color: "#64748b",
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
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              background: loading ? "#b8c5da" : "#1b4797",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 800,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "추천 중..." : "추천 보기"}
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
                    borderRadius: "16px",
                    marginBottom: "8px",
                    background: i === 0 ? "#f7fbff" : "#f8fafc",
                    border: `1px solid ${i === 0 ? "#cfe0f6" : "#e6edf5"}`,
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
                      {`추천 ${i + 1}`} · {rec.title}
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
  const [expandedSubsidyId, setExpandedSubsidyId] = useState(null);

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

  const visibleSubsidies = useMemo(() => {
    if (!showBookmarkOnly) return subsidies;
    return subsidies.filter((subsidy) => bookmarks.includes(subsidy.id));
  }, [bookmarks, showBookmarkOnly, subsidies]);

  // 날짜별 지원금 그룹핑 (마감일 기준)
  const subsidyByDay = useMemo(() => {
    const map = {};
    visibleSubsidies.forEach((s) => {
      const day = parseInt(s.end_date.slice(8, 10));
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [visibleSubsidies]);

  // 선택 날짜의 지원금
  const selectedSubsidies = useMemo(() => {
    if (!selectedDate) return [];
    return visibleSubsidies.filter(
      (s) => s.end_date.slice(8, 10) === String(selectedDate).padStart(2, "0"),
    );
  }, [selectedDate, visibleSubsidies]);

  // 리스트 뷰: D-day 임박 순 정렬, 마감 항목은 뒤로
  const sortedList = useMemo(() => {
    return [...visibleSubsidies].sort((a, b) => {
      const da = getDday(a.end_date),
        db = getDday(b.end_date);
      if (da < 0 && db >= 0) return 1;
      if (db < 0 && da >= 0) return -1;
      return da - db;
    });
  }, [visibleSubsidies]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
    setExpandedSubsidyId(null);
  }
  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
    setExpandedSubsidyId(null);
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
  const urgentCount = visibleSubsidies.filter((s) => {
    const d = getDday(s.end_date);
    return d >= 0 && d <= 7;
  }).length;
  const activeCount = visibleSubsidies.filter((s) => getDday(s.end_date) >= 0).length;
  const bookmarkedCount = bookmarks.length;

  return (
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
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
              빠른 확인
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              마감 임박 사업부터 보고, 필요하면 캘린더로 옮겨 확인하세요.
            </div>
          </div>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(27,71,151,0.08)",
              color: "#1b4797",
              fontSize: "11px",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {year}.{String(month).padStart(2, "0")}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          {[
            { label: "진행 중", value: `${activeCount}건` },
            { label: "이번 주 마감", value: `${urgentCount}건` },
            { label: "북마크", value: `${bookmarkedCount}건` },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "14px 10px",
                borderRadius: "18px",
                background: "#f8fafc",
                border: "1px solid #e6edf5",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {item.value}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                {item.label}
              </div>
            </div>
          ))}
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
          background: "#f3f6fb",
          borderRadius: "16px",
          padding: "4px",
          marginBottom: "16px",
        }}
      >
        {[ 
          { id: "calendar", label: "캘린더" },
          { id: "list", label: "리스트" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setView(t.id);
              setExpandedSubsidyId(null);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 800,
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
                setExpandedSubsidyId(null);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                cursor: "pointer",
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: sel ? 800 : 600,
                border: sel
                  ? `1.5px solid ${c.color}`
                  : "1px solid #dbe5f1",
                background: sel ? c.bg : "#fff",
                color: sel ? c.color : "var(--color-gray-700)",
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
            setExpandedSubsidyId(null);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: "999px",
            cursor: "pointer",
            flexShrink: 0,
            fontSize: "12px",
            fontWeight: showBookmarkOnly ? 800 : 600,
            border: showBookmarkOnly
              ? "1.5px solid #1b4797"
              : "1px solid #dbe5f1",
            background: showBookmarkOnly ? "#eef5ff" : "#fff",
            color: showBookmarkOnly ? "#1b4797" : "var(--color-gray-700)",
            transition: "all 0.15s",
          }}
        >
          관심 {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}
        </button>
      </div>

      {/* ── 캘린더 뷰 ── */}
      {view === "calendar" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              background: "#fff",
              borderRadius: "18px",
              padding: "14px 16px",
              border: "1px solid #e6edf5",
              marginBottom: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                스크랩한 사업 마감일도 캘린더에 반영돼요
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                관심 있는 공고만 따로 보면 마감일을 놓치기 쉽지 않습니다.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowBookmarkOnly((v) => !v);
                setSelectedDate(null);
                setExpandedSubsidyId(null);
              }}
              style={{
                flexShrink: 0,
                padding: "8px 12px",
                borderRadius: "999px",
                border: showBookmarkOnly ? "1px solid #cfe0f7" : "1px solid #dbe5f1",
                background: showBookmarkOnly ? "#eef5ff" : "#fff",
                color: showBookmarkOnly ? "#1b4797" : "#475569",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {showBookmarkOnly ? "전체 일정 보기" : "관심 일정만 보기"}
            </button>
          </div>

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
                  width: "36px",
                  height: "36px",
                  border: "1px solid #dbe5f1",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#334155",
                  boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
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
                  width: "36px",
                  height: "36px",
                  border: "1px solid #dbe5f1",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#334155",
                  boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
                }}
              >
                ›
              </button>
            </div>

            {/* 요일 헤더 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#eef4ff",
                color: "#48658f",
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              마감일 있는 날짜를 누르면 바로 볼 수 있어요
            </div>

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
                gap: "6px",
              }}
            >
              {grid.map((day, idx) => {
                // null 셀 (달 앞/뒤 빈 칸) — 완전히 빈 div만 렌더링
                if (!day) return <div key={idx} style={{ aspectRatio: "1" }} />;

                const dow = idx % 7;
                const hasSub = subsidyByDay[day];
                const dots = hasSub ? hasSub.slice(0, 3) : [];
                const bookmarkedItems = hasSub
                  ? hasSub.filter((item) => bookmarks.includes(item.id))
                  : [];
                const hasBookmarked = bookmarkedItems.length > 0;
                const isSelected = day === selectedDate;
                const isTod = isToday(day);
                const subsidyCount = hasSub ? hasSub.length : 0;
                const hasUrgent = hasSub
                  ? hasSub.some((item) => {
                      const dday = getDday(item.end_date);
                      return dday >= 0 && dday <= 7;
                    })
                  : false;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    aria-pressed={isSelected}
                    title={
                      hasSub
                        ? `${month}월 ${day}일 마감 지원금 ${subsidyCount}건`
                        : `${month}월 ${day}일`
                    }
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "4px",
                      padding: "7px 4px 8px",
                      borderRadius: "14px",
                      cursor: hasSub ? "pointer" : "default",
                      border:
                        isSelected
                          ? "1.5px solid #1b4797"
                          : hasBookmarked
                            ? "1.5px solid rgba(27,71,151,0.28)"
                          : hasSub
                            ? "1.5px solid rgba(27,71,151,0.16)"
                            : isTod
                              ? "1.5px solid rgba(27,71,151,0.28)"
                              : "1px solid #eef3f8",
                      background: isSelected
                        ? "linear-gradient(180deg, #1b4797 0%, #234f9f 100%)"
                        : hasBookmarked
                          ? "linear-gradient(180deg, #f5f9ff 0%, #eaf2ff 100%)"
                        : hasSub
                          ? "linear-gradient(180deg, #fbfdff 0%, #f1f6ff 100%)"
                          : isTod
                            ? "#f8fbff"
                            : "#fbfcfe",
                      boxShadow: isSelected
                        ? "0 10px 18px rgba(27,71,151,0.22)"
                        : hasSub
                          ? "0 6px 14px rgba(27,71,151,0.08)"
                          : "none",
                      transform: isSelected ? "translateY(-2px)" : "none",
                      transition: "all 0.18s ease",
                      paddingInline: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "100%",
                        minHeight: "18px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingRight: "6px",
                      }}
                    >
                      {hasSub ? (
                        <span
                          style={{
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 5px",
                            borderRadius: "999px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isSelected
                              ? "rgba(255,255,255,0.18)"
                              : hasUrgent
                                ? "#fff2ef"
                                : hasBookmarked
                                  ? "#dfe9fb"
                                : "#e9f1ff",
                            color: isSelected
                              ? "#ffffff"
                              : hasUrgent
                                ? "#d9554d"
                                : "#1b4797",
                            fontSize: "10px",
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {subsidyCount}
                        </span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: isSelected || isTod || hasSub ? 800 : 600,
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
                    {dots.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "3px",
                          justifyContent: "center",
                          minHeight: "8px",
                        }}
                      >
                        {dots.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isSelected
                                ? "rgba(255,255,255,0.8)"
                                : bookmarks.includes(s.id)
                                  ? "#1b4797"
                                : CAT_MAP[s.category]?.color || "#1b4797",
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span style={{ minHeight: "8px" }} />
                    )}
                  </button>
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
              const expanded = expandedSubsidyId === s.id;
              const applyStatus = getApplyStatus(s);
              const canApply = Boolean(s.apply_url || s.url) && !expired;
              return (
                <div
                  key={s.id}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "12px 12px 11px",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: cat.color,
                          background: cat.bg,
                          padding: "3px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {s.category}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: applyStatus.color,
                          background: applyStatus.bg,
                          padding: "3px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {applyStatus.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => toggleBookmark(s.id)}
                        style={{
                          height: "28px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          border: isBookmarked
                            ? "1px solid rgba(27,71,151,0.18)"
                            : "1px solid #dbe5f1",
                          background: isBookmarked ? "#eef5ff" : "#f8fafc",
                          color: isBookmarked ? "#1b4797" : "#64748b",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 800,
                          lineHeight: 1,
                          transition: "all 0.15s",
                        }}
                      >
                        {isBookmarked ? "스크랩됨" : "스크랩"}
                      </button>
                      <DdayBadge endDate={s.end_date} />
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-gray-900)",
                      marginBottom: "4px",
                      lineHeight: 1.35,
                    }}
                  >
                    {s.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: expanded ? "8px" : "0",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        fontSize: "12px",
                        color: "var(--color-gray-500)",
                        lineHeight: 1.45,
                      }}
                    >
                      {s.target || "대상 조건은 공고문에서 확인하세요"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSubsidyId((prev) => (prev === s.id ? null : s.id))
                      }
                      style={{
                        flexShrink: 0,
                        height: "28px",
                        padding: "0 10px",
                        borderRadius: "999px",
                        border: "1px solid #dbe5f1",
                        background: "#fff",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {expanded ? "접기" : "상세보기"}
                    </button>
                  </div>

                  {s.amount && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-primary)",
                        fontWeight: 700,
                        marginTop: "6px",
                      }}
                    >
                      💰 {s.amount}
                    </div>
                  )}

                  {expanded && (
                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--color-gray-200)",
                      }}
                    >
                      {(s.start_date || s.end_date) && (
                        <div
                          style={{
                            fontSize: "12px",
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
                            fontSize: "12px",
                            color: "var(--color-gray-500)",
                            marginBottom: s.description ? "6px" : "0",
                          }}
                        >
                          👥 대상: {s.target}
                        </div>
                      )}
                      {s.description ? (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-gray-700)",
                            lineHeight: 1.55,
                          }}
                        >
                          {s.description}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: expanded ? "10px" : "9px",
                    }}
                  >
                    {canApply ? (
                      <a
                        href={s.apply_url || s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          borderRadius: "10px",
                          textAlign: "center",
                          background: "var(--color-primary)",
                          color: "#fff",
                          fontSize: "12px",
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
                          padding: "9px 12px",
                          borderRadius: "10px",
                          textAlign: "center",
                          background: "var(--color-gray-100)",
                          color: "var(--color-gray-500)",
                          fontSize: "12px",
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
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#fff0f0",
                          color: "var(--color-danger)",
                          fontSize: "11px",
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
              desc: "소상공인 지원사업 공고",
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
                display: "grid",
                gridTemplateColumns: "40px 1fr",
                alignItems: "center",
                gap: "10px",
                padding: "12px",
                borderRadius: "14px",
                background: "#fff",
                border: "1.5px solid var(--color-gray-200)",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                minHeight: "82px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "21px",
                  lineHeight: 1,
                  flexShrink: 0,
                  borderRadius: "12px",
                  background: "#f8fafc",
                }}
              >
                {link.icon}
              </span>
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: "40px",
                  flex: 1,
                }}
              >
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
                    minHeight: "30px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
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
