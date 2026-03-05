"use client";
import { useState, useMemo, useEffect } from "react";

// 숫자 → 천단위 콤마 문자열
function formatNumber(val) {
  const num = val.replace(/[^0-9]/g, "");
  return num ? Number(num).toLocaleString() : "";
}
function parseNum(val) {
  return parseFloat(String(val).replace(/,/g, "")) || 0;
}
function getMarginStatus(rate) {
  if (rate >= 30)
    return {
      emoji: "😊",
      label: "양호",
      bg: "rgba(46,204,113,0.25)",
      color: "#27ae60",
    };
  if (rate >= 10)
    return {
      emoji: "🤔",
      label: "보통",
      bg: "rgba(243,156,18,0.25)",
      color: "#e67e22",
    };
  return {
    emoji: "😨",
    label: "위험",
    bg: "rgba(231,76,60,0.25)",
    color: "#e74c3c",
  };
}

// 공유 텍스트 생성
function buildShareText({
  appName,
  price,
  margin,
  marginRate,
  dailyOrders,
  monthlyMargin,
}) {
  const status =
    marginRate >= 30 ? "😊 양호" : marginRate >= 10 ? "🤔 보통" : "😨 위험";
  return `📊 실마진 계산 결과 (${appName})\n━━━━━━━━━━━━━\n💰 판매가: ${price.toLocaleString()}원\n✅ 실마진: ${margin.toLocaleString()}원 (${marginRate.toFixed(1)}%) ${status}${dailyOrders ? `\n📦 하루 ${dailyOrders}건 기준 월 마진: ${monthlyMargin.toLocaleString()}원` : ""}\n━━━━━━━━━━━━━\n[LOUNGE 실마진 계산기]`;
}

// 툴팁
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        marginLeft: "5px",
      }}
    >
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={(e) => {
          e.preventDefault();
          setShow((v) => !v);
        }}
        style={{
          width: "17px",
          height: "17px",
          borderRadius: "50%",
          background: "#dce7f9",
          color: "var(--color-primary)",
          fontSize: "10px",
          fontWeight: 800,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "1px solid #b8ccf0",
        }}
      >
        ?
      </span>
      {show && (
        <span
          style={{
            position: "absolute",
            bottom: "24px",
            left: 0,
            background: "var(--color-gray-900)",
            color: "#fff",
            fontSize: "12px",
            padding: "8px 12px",
            borderRadius: "10px",
            whiteSpace: "normal",
            maxWidth: "200px",
            width: "max-content",
            zIndex: 200,
            lineHeight: 1.6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "6px",
              width: "10px",
              height: "10px",
              background: "var(--color-gray-900)",
              transform: "rotate(45deg)",
              borderRadius: "2px",
            }}
          />
        </span>
      )}
    </span>
  );
}

// 토글 스위치
function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        background: on ? "var(--color-primary)" : "var(--color-gray-300)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: on ? "23px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

// 배달앱 로고 — Google favicon 우선, 실패하면 브랜드 컬러 원으로 fallback
function PlatformLogo({ faviconUrl, color, name }) {
  const [failed, setFailed] = useState(false);
  const initial = name ? name.charAt(0) : "?";

  if (!faviconUrl || failed) {
    return (
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          flexShrink: 0,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#fff", fontSize: "14px", fontWeight: 800 }}>
          {initial}
        </span>
      </div>
    );
  }
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: '#fff', border: '1px solid #eee',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img
        src={faviconUrl}
        alt={name}
        width={30}
        height={30}
        onError={() => setFailed(true)}
        style={{ objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

// AI 분석 섹션
function AiAnalysisSection({ calc, platformName, feeRate }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [industry, setIndustry] = useState("");
  const INDUSTRIES = ["카페", "치킨", "피자", "한식", "분식", "중식"];

  async function handleAnalyze() {
    if (!calc) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tools/margin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformName,
          feeRate,
          menuPrice: calc.price,
          menuCost: calc.cost,
          deliveryFee: calc.delivery,
          marginRate: calc.marginRate,
          margin: calc.margin,
          industry,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "AI 분석을 사용할 수 없습니다");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    setLoading(false);
  }

  if (!calc) return null;
  return (
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustry(ind === industry ? "" : ind)}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              border:
                industry === ind ? "1.5px solid #7c3aed" : "1.5px solid #ddd",
              background: industry === ind ? "#7c3aed" : "#fff",
              color: industry === ind ? "#fff" : "#666",
              cursor: "pointer",
            }}
          >
            {ind}
          </button>
        ))}
      </div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          background: loading
            ? "#ccc"
            : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span className="fee-typing-dot" />
            <span
              className="fee-typing-dot"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="fee-typing-dot"
              style={{ animationDelay: "0.4s" }}
            />
            <span style={{ marginLeft: "4px" }}>AI 분석 중...</span>
          </>
        ) : (
          "🤖 AI 분석 받기"
        )}
      </button>
      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "12px 14px",
            background: "#fff8e1",
            border: "1px solid #f39c12",
            color: "#7d5a00",
            borderRadius: "10px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={handleAnalyze}
            style={{
              background: "none",
              border: "1px solid #f39c12",
              color: "#7d5a00",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "12px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      {result && (
        <div
          style={{
            marginTop: "12px",
            background: "#1a1a2e",
            borderRadius: "16px",
            padding: "20px",
            animation: "fadeSlideUp 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "18px" }}>🤖</span>
            <span
              style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa" }}
            >
              AI 수익성 분석
            </span>
            {result.cached && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "rgba(167,139,250,0.2)",
                  color: "#a78bfa",
                  marginLeft: "auto",
                }}
              >
                캐시됨
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#e0e0e0",
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {result.text}
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "#556",
              marginTop: "10px",
              marginBottom: 0,
            }}
          >
            * AI 분석은 참고용입니다. 실제 경영 결정은 전문가와 상의하세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DeliveryMarginCalculator() {
  // 플랫폼 데이터 (API에서 동적 로드)
  const [platforms, setPlatforms] = useState([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  // 선택 상태
  const [selectedPlatformId, setSelectedPlatformId] = useState("baemin");
  const [selectedTierId, setSelectedTierId] = useState(null); // null = default tier 사용
  const [customFee, setCustomFee] = useState("");

  // 입력값
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCost, setMenuCost] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [cardFeeOn, setCardFeeOn] = useState(true);
  const [vatOn, setVatOn] = useState(false);
  const [dailyOrders, setDailyOrders] = useState("");
  const [fixedCost, setFixedCost] = useState(""); // BEP용 월 고정비
  const [shareMsg, setShareMsg] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  // /api/delivery-fees 로드
  useEffect(() => {
    fetch("/api/delivery-fees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length) {
          setPlatforms(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlatforms(false));
  }, []);

  // 선택된 플랫폼 객체
  const selectedPlatform = useMemo(
    () => platforms.find((p) => p.platform_id === selectedPlatformId) || null,
    [platforms, selectedPlatformId],
  );

  // 선택된 티어 (selectedTierId → 없으면 is_default=1 → 없으면 첫번째)
  const selectedTier = useMemo(() => {
    if (!selectedPlatform) return null;
    const tiers = selectedPlatform.tiers || [];
    if (selectedTierId)
      return (
        tiers.find((t) => t.id === selectedTierId) ||
        tiers.find((t) => t.is_default) ||
        tiers[0]
      );
    return tiers.find((t) => t.is_default) || tiers[0] || null;
  }, [selectedPlatform, selectedTierId]);

  // 수수료율 계산
  const feeRate =
    selectedPlatformId === "custom"
      ? parseFloat(customFee) || 0
      : parseFloat(selectedTier?.fee_rate || 0);
  const payFeeRate =
    selectedPlatformId === "custom"
      ? 0
      : parseFloat(selectedTier?.payment_fee_rate || 0);
  // 카드수수료 토글: custom이면 1.5% 사용, API 데이터 있으면 payFeeRate 사용
  const effectivePayRate = cardFeeOn
    ? selectedPlatformId === "custom"
      ? 1.5
      : payFeeRate
    : 0;

  // 실시간 계산
  const calc = useMemo(() => {
    const price = parseNum(menuPrice);
    const cost = parseNum(menuCost);
    const delivery = parseNum(deliveryFee);
    if (!price) return null;

    const appFee = Math.round((price * feeRate) / 100); // 중개 수수료
    const cardFee = Math.round((price * effectivePayRate) / 100); // 결제 수수료
    const vatAmount = vatOn ? Math.round(price * 0.1) : 0;
    const margin = price - appFee - cardFee - delivery - cost - vatAmount;
    const marginRate = price > 0 ? (margin / price) * 100 : 0;

    const costRatio = Math.max(0, (cost / price) * 100);
    const feeRatio = Math.max(0, ((appFee + cardFee) / price) * 100);
    const otherRatio = Math.max(0, ((delivery + vatAmount) / price) * 100);
    const marginRatio = Math.max(0, (margin / price) * 100);

    return {
      price,
      appFee,
      cardFee,
      vatAmount,
      delivery,
      cost,
      margin,
      marginRate,
      costRatio,
      feeRatio,
      otherRatio,
      marginRatio,
    };
  }, [menuPrice, menuCost, deliveryFee, feeRate, effectivePayRate, vatOn]);

  // 월 시뮬레이션
  const simulation = useMemo(() => {
    if (!calc || !dailyOrders) return null;
    const orders = parseInt(dailyOrders) || 0;
    if (!orders) return null;
    return {
      orders,
      dailyMargin: calc.margin * orders,
      weeklyMargin: calc.margin * orders * 7,
      monthlyMargin: calc.margin * orders * 30,
    };
  }, [calc, dailyOrders]);

  // 배달앱별 마진 비교 (API 데이터 기반)
  const comparison = useMemo(() => {
    const price = parseNum(menuPrice);
    const cost = parseNum(menuCost);
    const delivery = parseNum(deliveryFee);
    if (!price || !platforms.length) return null;

    return platforms.map((platform) => {
      const defaultTier =
        platform.tiers?.find((t) => t.is_default) || platform.tiers?.[0];
      const pFee = parseFloat(defaultTier?.fee_rate || 0);
      const pPay = cardFeeOn
        ? parseFloat(defaultTier?.payment_fee_rate || 0)
        : 0;
      const appFee = Math.round((price * pFee) / 100);
      const cardFee = Math.round((price * pPay) / 100);
      const vat = vatOn ? Math.round(price * 0.1) : 0;
      const margin = price - appFee - cardFee - delivery - cost - vat;
      const rate = price > 0 ? (margin / price) * 100 : 0;
      return { platform, margin, rate, feeRate: pFee, payRate: pPay };
    });
  }, [menuPrice, menuCost, deliveryFee, platforms, cardFeeOn, vatOn]);

  function handleShare() {
    if (!calc) return;
    const text = buildShareText({
      appName: selectedPlatform?.name || "직접입력",
      price: calc.price,
      margin: calc.margin,
      marginRate: calc.marginRate,
      dailyOrders: parseInt(dailyOrders) || 0,
      monthlyMargin: simulation?.monthlyMargin || 0,
    });
    try {
      if (navigator.share) {
        navigator.share({ title: "실마진 계산 결과", text });
        setShareMsg("공유 완료!");
      } else {
        navigator.clipboard.writeText(text);
        setShareMsg("클립보드에 복사됐어요!");
      }
    } catch {
      setShareMsg("공유를 취소했습니다");
    }
    setTimeout(() => setShareMsg(""), 2500);
  }

  function handleNumInput(setter) {
    return (e) => setter(formatNumber(e.target.value));
  }

  const inputStyle = {
    textAlign: "right",
    padding: "11px 14px",
    fontSize: "15px",
    fontWeight: 600,
    border: "1.5px solid var(--color-gray-300)",
    borderRadius: "var(--radius-sm)",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    transition: "border-color 0.15s",
  };
  const labelStyle = {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-gray-700)",
    display: "flex",
    alignItems: "center",
  };
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  };

  // 플랫폼 버튼에 표시할 총 수수료율 (default 구간 기준)
  function getPlatformDisplayRate(platform) {
    const tier =
      platform.tiers?.find((t) => t.is_default) || platform.tiers?.[0];
    if (!tier) return null;
    return (
      parseFloat(tier.fee_rate) + parseFloat(tier.payment_fee_rate)
    ).toFixed(1);
  }

  // 플랫폼별 로컬 로고 경로 (public/logos/ 폴더)
  const FAVICON_DOMAINS = {
    baemin:  '/logos/baemin.png',
    coupang: '/logos/coupang.png',
    yogiyo:  '/logos/yogiyo.png',
    ddangyo: '/logos/ddangyo.png',
  };

  // 티어 선택이 필요한 플랫폼 (구간이 2개 이상)
  const hasTiers =
    selectedPlatform && (selectedPlatform.tiers?.length || 0) > 1;

  // 티어 라벨 단축 — 괄호 안 내용 우선, 없으면 첫 단어
  function shortTierLabel(label) {
    const match = label.match(/\(([^)]+)\)/);
    if (match) return match[1];
    return label.split(" ")[0];
  }

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "0 0 40px",
        background: "var(--color-bg)",
        minHeight: "100%",
      }}
    >
      <div style={{ padding: "16px 16px 0" }}>
        {/* ── 입력 카드 ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(27,71,151,0.08)",
            marginBottom: "16px",
          }}
        >
          {/* ① 배달앱 선택 (API 데이터 기반) */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-gray-700)",
              marginBottom: "10px",
            }}
          >
            배달앱 선택
          </div>
          {loadingPlatforms ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "68px",
                    borderRadius: "14px",
                    background: "var(--color-gray-100)",
                    animation: "shimmer 1.2s infinite",
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: hasTiers ? "12px" : "20px",
              }}
            >
              {platforms.map((p) => {
                const active = selectedPlatformId === p.platform_id;
                const totalRate = getPlatformDisplayRate(p);
                // FAVICON_DOMAINS 값이 이미 로컬 경로 (/logos/xxx.png)이므로 그대로 사용
                const faviconUrl = FAVICON_DOMAINS[p.platform_id] || null;
                return (
                  <button
                    key={p.platform_id}
                    onClick={() => {
                      setSelectedPlatformId(p.platform_id);
                      setSelectedTierId(null);
                    }}
                    style={{
                      padding: "12px 10px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      border: active
                        ? `2px solid ${p.color}`
                        : "1.5px solid #e8eaf0",
                      background: active ? `${p.color}12` : "#fff",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.15s ease",
                      boxShadow: active
                        ? `0 2px 10px ${p.color}30`
                        : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* 로고 영역 */}
                    <PlatformLogo
                      faviconUrl={faviconUrl}
                      color={p.color}
                      name={p.name}
                    />
                    {/* 텍스트 영역 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        textAlign: "left",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: active ? p.color : "#111",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.name}
                      </span>
                      {totalRate && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: 800,
                              color: active ? p.color : "#333",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {totalRate}%
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 500,
                              color: active ? p.color : "#888",
                            }}
                          >
                            총부담
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {/* 직접입력 버튼 */}
              <button
                onClick={() => {
                  setSelectedPlatformId("custom");
                  setSelectedTierId(null);
                }}
                style={{
                  padding: "12px 10px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  border:
                    selectedPlatformId === "custom"
                      ? "2px solid #1b4797"
                      : "1.5px solid #e8eaf0",
                  background:
                    selectedPlatformId === "custom" ? "#eef2fb" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  boxShadow:
                    selectedPlatformId === "custom"
                      ? "0 2px 10px rgba(27,71,151,0.15)"
                      : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>✏️</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: selectedPlatformId === "custom" ? "#1b4797" : "#333",
                  }}
                >
                  직접입력
                </span>
              </button>
            </div>
          )}

          {/* ② 수수료 구간 선택 — 토스 스타일 세그먼트 탭 */}
          {hasTiers &&
            selectedPlatformId !== "custom" &&
            (() => {
              const activeTier =
                selectedPlatform.tiers.find((t) =>
                  selectedTierId ? t.id === selectedTierId : t.is_default,
                ) || selectedPlatform.tiers[0];
              return (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-gray-600)",
                      marginBottom: "8px",
                    }}
                  >
                    내 매출 구간 선택
                  </div>
                  {/* 세그먼트 컨트롤 컨테이너 — 회색 트랙 위에 흰 pill이 슬라이드 */}
                  <div
                    style={{
                      display: "flex",
                      background: "#f0f1f5",
                      borderRadius: "12px",
                      padding: "4px",
                      gap: "2px",
                    }}
                  >
                    {selectedPlatform.tiers.map((tier) => {
                      const isActive = tier.id === activeTier.id;
                      const total = (
                        parseFloat(tier.fee_rate) +
                        parseFloat(tier.payment_fee_rate)
                      ).toFixed(1);
                      const short = shortTierLabel(tier.tier_label);
                      return (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTierId(tier.id)}
                          style={{
                            flex: 1,
                            padding: "8px 4px",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "9px",
                            transition: "all 0.18s ease",
                            background: isActive ? "#fff" : "transparent",
                            boxShadow: isActive
                              ? "0 1px 6px rgba(0,0,0,0.10)"
                              : "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: isActive ? selectedPlatform.color : "#888",
                              lineHeight: 1,
                            }}
                          >
                            {short}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: isActive ? selectedPlatform.color : "#555",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {total}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* 선택된 구간 상세 설명 줄 */}
                  <div
                    style={{
                      marginTop: "7px",
                      fontSize: "11px",
                      color: "#888",
                      textAlign: "center",
                    }}
                  >
                    중개 {activeTier.fee_rate}% + 결제{" "}
                    {activeTier.payment_fee_rate}% &nbsp;·&nbsp;{" "}
                    {activeTier.tier_label}
                  </div>
                </div>
              );
            })()}

          {/* 직접입력 시 수수료율 필드 */}
          {selectedPlatformId === "custom" && (
            <div style={{ ...rowStyle, marginBottom: "16px" }}>
              <label style={labelStyle}>
                수수료율{" "}
                <Tooltip text="배달앱에서 청구하는 중개 수수료율을 입력하세요" />
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "130px",
                }}
              >
                <input
                  style={{ ...inputStyle, width: "90px" }}
                  type="number"
                  placeholder="0.0"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  inputMode="decimal"
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--color-gray-500)",
                    fontWeight: 600,
                  }}
                >
                  %
                </span>
              </div>
            </div>
          )}

          {/* ③ 입력 필드 3개 */}
          {[
            {
              label: "메뉴 판매가",
              tip: "고객이 실제로 결제하는 메뉴 가격",
              placeholder: "15,000",
              value: menuPrice,
              setter: setMenuPrice,
            },
            {
              label: "메뉴 원가",
              tip: "재료비, 포장재 등 해당 메뉴를 만드는 데 드는 비용",
              placeholder: "5,000",
              value: menuCost,
              setter: setMenuCost,
            },
            {
              label: "배달비 부담",
              tip: "사장님이 직접 부담하는 배달대행비. 고객 부담이면 0원 입력",
              placeholder: "0",
              value: deliveryFee,
              setter: setDeliveryFee,
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ ...rowStyle, ...(i === 2 ? { marginBottom: 0 } : {}) }}
            >
              <label style={labelStyle}>
                {item.label}
                <Tooltip text={item.tip} />
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "150px",
                }}
              >
                <input
                  style={inputStyle}
                  type="text"
                  inputMode="numeric"
                  placeholder={item.placeholder}
                  value={item.value}
                  onChange={handleNumInput(item.setter)}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-gray-500)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  원
                </span>
              </div>
            </div>
          ))}

          {/* ④ 토글 스위치 */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: "1px solid var(--color-gray-200)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-gray-700)",
                }}
              >
                결제(카드)수수료 포함
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-gray-500)",
                    marginLeft: "5px",
                  }}
                >
                  (
                  {selectedPlatformId === "custom"
                    ? "1.5"
                    : effectivePayRate.toFixed(1)}
                  %)
                </span>
              </span>
              <Toggle on={cardFeeOn} onChange={setCardFeeOn} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-gray-700)",
                }}
              >
                부가세 포함
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-gray-500)",
                    marginLeft: "5px",
                  }}
                >
                  (10%)
                </span>
              </span>
              <Toggle on={vatOn} onChange={setVatOn} />
            </div>
          </div>
        </div>

        {/* ── 결과 카드 ── */}
        {!calc ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "28px 24px",
              boxShadow: "0 4px 20px rgba(27,71,151,0.08)",
              textAlign: "center",
              color: "var(--color-gray-500)",
              fontSize: "14px",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              {/* 영수증 + 마진 상승 그래프 아이콘 */}
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="56" height="56" rx="16" fill="#eef2fb" />
                {/* 영수증 몸통 */}
                <rect
                  x="14"
                  y="10"
                  width="22"
                  height="30"
                  rx="3"
                  fill="#dce7f9"
                />
                {/* 영수증 하단 지그재그 */}
                <path
                  d="M14 40 L17 37 L20 40 L23 37 L26 40 L29 37 L32 40 L36 40 V10 H14 V40Z"
                  fill="#c5d5f5"
                />
                {/* 영수증 선들 */}
                <rect
                  x="18"
                  y="16"
                  width="14"
                  height="2"
                  rx="1"
                  fill="#1b4797"
                  opacity="0.3"
                />
                <rect
                  x="18"
                  y="21"
                  width="10"
                  height="2"
                  rx="1"
                  fill="#1b4797"
                  opacity="0.3"
                />
                <rect
                  x="18"
                  y="26"
                  width="12"
                  height="2"
                  rx="1"
                  fill="#1b4797"
                  opacity="0.3"
                />
                {/* 오른쪽 상단 상승 화살표 (마진 증가 의미) */}
                <circle cx="40" cy="20" r="10" fill="#1b4797" />
                <path
                  d="M35 23 L40 14 L45 23"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <line
                  x1="40"
                  y1="14"
                  x2="40"
                  y2="24"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            메뉴 판매가를 입력하면 마진이 계산됩니다
          </div>
        ) : (
          <>
            {calc.margin < 0 && (
              <div
                style={{
                  background: "#fff0f0",
                  border: "2px solid #e74c3c",
                  borderRadius: "14px",
                  padding: "14px 18px",
                  marginBottom: "12px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  animation: "fadeSlideUp 0.25s ease",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>🚨</span>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#e74c3c",
                      marginBottom: "3px",
                    }}
                  >
                    이 메뉴는 팔수록 손해예요
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#c0392b",
                      lineHeight: 1.5,
                    }}
                  >
                    건당 {Math.abs(calc.margin).toLocaleString()}원 손실이
                    발생합니다. 판매가를 올리거나 원가를 줄여보세요.
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                background:
                  calc.marginRate >= 30
                    ? "linear-gradient(135deg, #1b6b3a 0%, #2ecc71 100%)"
                    : calc.marginRate >= 10
                      ? "linear-gradient(135deg, #7d5a00 0%, #f39c12 100%)"
                      : calc.margin < 0
                        ? "linear-gradient(135deg, #7d1b1b 0%, #e74c3c 100%)"
                        : "linear-gradient(135deg, #1b4797 0%, #2d5fc4 100%)",
                borderRadius: "20px",
                padding: "28px 24px",
                color: "#fff",
                animation: "fadeSlideUp 0.25s ease",
                transition: "background 0.5s ease",
              }}
            >
              {/* 실마진 BIG */}
              <div
                style={{ marginBottom: "4px", fontSize: "13px", opacity: 0.8 }}
              >
                실수령 마진
              </div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  marginBottom: "10px",
                }}
              >
                ₩ {calc.margin.toLocaleString()}
              </div>

              {/* 마진율 뱃지 */}
              {(() => {
                const status = getMarginStatus(calc.marginRate);
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: status.bg,
                      marginBottom: "20px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{status.emoji}</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {calc.marginRate.toFixed(1)}% {status.label}
                    </span>
                  </div>
                );
              })()}

              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.2)",
                  marginBottom: "18px",
                }}
              />

              {/* 항목별 차감 내역 — 중개/결제 수수료 분리 표시 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {[
                  {
                    icon: "📦",
                    label: "판매가",
                    amount: calc.price,
                    sign: "+",
                    sub: null,
                  },
                  {
                    icon: "🏪",
                    label: "배달앱 수수료",
                    amount: calc.appFee,
                    sign: "-",
                    sub: `중개 ${feeRate.toFixed(1)}%`,
                  },
                  ...(cardFeeOn && calc.cardFee > 0
                    ? [
                        {
                          icon: "💳",
                          label: "결제(카드)수수료",
                          amount: calc.cardFee,
                          sign: "-",
                          sub: `${effectivePayRate.toFixed(1)}%`,
                        },
                      ]
                    : []),
                  ...(calc.delivery > 0
                    ? [
                        {
                          icon: "🛵",
                          label: "배달비 부담",
                          amount: calc.delivery,
                          sign: "-",
                          sub: null,
                        },
                      ]
                    : []),
                  ...(calc.cost > 0
                    ? [
                        {
                          icon: "🥘",
                          label: "원가",
                          amount: calc.cost,
                          sign: "-",
                          sub: null,
                        },
                      ]
                    : []),
                  ...(vatOn
                    ? [
                        {
                          icon: "🧾",
                          label: "부가세",
                          amount: calc.vatAmount,
                          sign: "-",
                          sub: "10%",
                        },
                      ]
                    : []),
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ opacity: 0.85 }}>
                      {item.icon} {item.label}
                      {item.sub && (
                        <span
                          style={{
                            fontSize: "11px",
                            opacity: 0.6,
                            marginLeft: "4px",
                          }}
                        >
                          ({item.sub})
                        </span>
                      )}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {item.sign === "+" ? "+" : "-"}
                      {item.amount.toLocaleString()}원
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.2)",
                    margin: "2px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  <span>✅ 실마진</span>
                  <span>{calc.margin.toLocaleString()}원</span>
                </div>
              </div>

              {/* 시각화 바 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    height: "12px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: `${calc.costRatio}%`,
                      background: "#e74c3c",
                      transition: "width 0.3s ease",
                    }}
                  />
                  <div
                    style={{
                      width: `${calc.feeRatio}%`,
                      background: "#f39c12",
                      transition: "width 0.3s ease",
                    }}
                  />
                  <div
                    style={{
                      width: `${calc.otherRatio}%`,
                      background: "#adb5bd",
                      transition: "width 0.3s ease",
                    }}
                  />
                  <div
                    style={{
                      width: `${calc.marginRatio}%`,
                      background: "#2ecc71",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    ["#e74c3c", "원가"],
                    ["#f39c12", "수수료"],
                    ["#adb5bd", "기타공제"],
                    ["#2ecc71", "실마진"],
                  ].map(([color, label], i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          background: color,
                        }}
                      />
                      <span style={{ fontSize: "11px", opacity: 0.8 }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 월 매출 시뮬레이션 */}
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    opacity: 0.9,
                    marginBottom: "12px",
                  }}
                >
                  📈 월 매출 시뮬레이션
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", opacity: 0.8, flexShrink: 0 }}
                  >
                    하루 평균
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={dailyOrders}
                    onChange={(e) =>
                      setDailyOrders(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    style={{
                      width: "68px",
                      padding: "8px 10px",
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#1b4797",
                      border: "none",
                      borderRadius: "8px",
                      outline: "none",
                      fontFamily: "inherit",
                      background: "#fff",
                    }}
                  />
                  <span
                    style={{ fontSize: "13px", opacity: 0.8, flexShrink: 0 }}
                  >
                    건 주문 시
                  </span>
                </div>

                {/* 월 고정비 입력 (BEP용) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", opacity: 0.75, flexShrink: 0 }}
                  >
                    월 고정비
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="임대료+공과금 (예: 1,500,000)"
                    value={fixedCost}
                    onChange={handleNumInput(setFixedCost)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "#1b4797",
                      border: "none",
                      borderRadius: "8px",
                      outline: "none",
                      fontFamily: "inherit",
                      background: "rgba(255,255,255,0.85)",
                    }}
                  />
                  <span
                    style={{ fontSize: "11px", opacity: 0.7, flexShrink: 0 }}
                  >
                    원
                  </span>
                </div>

                {simulation ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {[
                      ["📅 하루 마진", simulation.dailyMargin],
                      ["📆 주간 마진", simulation.weeklyMargin],
                    ].map(([label, val], i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          opacity: 0.85,
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ fontWeight: 700 }}>
                          {Math.round(val).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255,255,255,0.2)",
                        margin: "4px 0",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>
                          💰 월 실마진
                        </div>
                        <div style={{ fontSize: "11px", opacity: 0.65 }}>
                          {simulation.orders}건 × 30일
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 800,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {Math.round(simulation.monthlyMargin).toLocaleString()}
                        원
                      </div>
                    </div>
                    {/* FIX 3: 올바른 일일 주문수 계산 */}
                    {calc.margin > 0 &&
                      (() => {
                        const dailyNeeded = Math.ceil(
                          2000000 / (calc.margin * 30),
                        );
                        if (dailyNeeded > 999) {
                          return (
                            <div
                              style={{
                                marginTop: "4px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                background: "rgba(231,76,60,0.2)",
                                fontSize: "12px",
                                lineHeight: 1.5,
                              }}
                            >
                              😢 현재 마진으로는 월 200만원 달성이 어렵습니다.
                              판매가 조정을 고려해보세요.
                            </div>
                          );
                        }
                        return (
                          <div
                            style={{
                              marginTop: "4px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.15)",
                              fontSize: "12px",
                              lineHeight: 1.5,
                            }}
                          >
                            💡 월 200만원 달성하려면 하루{" "}
                            <strong>{dailyNeeded}건</strong> 필요해요! 💪
                          </div>
                        );
                      })()}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.6,
                      textAlign: "center",
                      padding: "8px 0",
                    }}
                  >
                    건수를 입력하면 월 마진이 계산됩니다
                  </div>
                )}
              </div>

              {/* BEP (손익분기점) */}
              {calc.margin > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: "8px",
                      opacity: 0.9,
                    }}
                  >
                    📊 목표 달성 주문수 (하루 기준)
                  </div>
                  {[
                    ["월 200만원", 2000000],
                    ["월 500만원", 5000000],
                  ].map(([label, target]) => {
                    const daily = Math.ceil(target / (calc.margin * 30));
                    return (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ opacity: 0.8 }}>{label} 달성</span>
                        <span style={{ fontWeight: 700 }}>
                          {daily > 999 ? "달성 어려움" : `하루 ${daily}건`}
                        </span>
                      </div>
                    );
                  })}
                  {/* 고정비 입력 시 BEP 계산 */}
                  {parseNum(fixedCost) > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "6px",
                        paddingTop: "6px",
                        borderTop: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <span style={{ opacity: 0.8 }}>고정비 회수 (BEP)</span>
                      <span style={{ fontWeight: 700 }}>
                        {(() => {
                          const bep = Math.ceil(
                            parseNum(fixedCost) / calc.margin,
                          );
                          return bep > 99999
                            ? "달성 어려움"
                            : `${bep.toLocaleString()}건/월`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 공유 버튼 */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowCompare((v) => !v)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {showCompare ? "비교 닫기" : "📊 앱 비교"}
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                  }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="15" cy="4" r="2" />
                    <circle cx="5" cy="10" r="2" />
                    <circle cx="15" cy="16" r="2" />
                    <path d="M7 9l6-4M7 11l6 4" />
                  </svg>
                  {shareMsg || "결과 공유"}
                </button>
              </div>
            </div>

            {/* 배달앱 마진 비교 (API 기반) */}
            {showCompare && comparison && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "20px",
                  marginTop: "12px",
                  boxShadow: "0 4px 20px rgba(27,71,151,0.1)",
                  animation: "fadeSlideUp 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--color-gray-900)",
                    marginBottom: "14px",
                  }}
                >
                  📊 배달앱별 마진 비교
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {[...comparison]
                    .sort((a, b) => b.margin - a.margin)
                    .map(
                      ({
                        platform,
                        margin,
                        rate,
                        feeRate: fr,
                        payRate: pr,
                      }) => {
                        const status = getMarginStatus(rate);
                        const isSelected =
                          selectedPlatformId === platform.platform_id;
                        return (
                          <div
                            key={platform.platform_id}
                            style={{
                              padding: "12px 14px",
                              borderRadius: "12px",
                              border: isSelected
                                ? `2px solid ${platform.color}`
                                : "1.5px solid var(--color-gray-200)",
                              background: isSelected
                                ? `${platform.color}08`
                                : "#fafafa",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: platform.color,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "var(--color-gray-900)",
                                  }}
                                >
                                  {platform.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--color-gray-500)",
                                  }}
                                >
                                  총 {(fr + pr).toFixed(1)}%
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "8px",
                                  background: status.bg.replace("0.25", "0.15"),
                                  color: status.color,
                                }}
                              >
                                {status.emoji} {rate.toFixed(1)}%
                              </span>
                            </div>
                            <div
                              style={{
                                marginTop: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: "6px",
                                  borderRadius: "4px",
                                  background: "var(--color-gray-100)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    borderRadius: "4px",
                                    width: `${Math.max(0, rate)}%`,
                                    background:
                                      margin < 0 ? "#e74c3c" : platform.color,
                                    transition: "width 0.4s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 800,
                                  color:
                                    margin < 0
                                      ? "#e74c3c"
                                      : "var(--color-gray-900)",
                                  minWidth: "80px",
                                  textAlign: "right",
                                }}
                              >
                                {margin.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        );
                      },
                    )}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI 분석 섹션 */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(27,71,151,0.08)",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            🤖 AI 수익성 분석
          </div>
          <div
            style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}
          >
            업종을 선택하면 동종업계 평균과 비교해 드려요
          </div>
          <AiAnalysisSection
            calc={calc}
            platformName={selectedPlatform?.name || "직접입력"}
            feeRate={feeRate + effectivePayRate}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
