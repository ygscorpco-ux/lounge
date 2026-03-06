"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./DeliveryMarginCalculator.module.css";

const PLATFORM_LOGOS = {
  baemin: "/logos/baemin.png",
  coupang: "/logos/coupang.png",
  yogiyo: "/logos/yogiyo.png",
  ddangyo: "/logos/ddangyo.png",
};

const ANALYSIS_INDUSTRIES = ["한식", "치킨", "분식", "카페", "중식", "피자"];

const numberFormatter = new Intl.NumberFormat("ko-KR");
const percentFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatNumberInput(value) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? numberFormatter.format(Number(digits)) : "";
}

function sanitizePercentInput(value) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const integer = (parts[0] || "").slice(0, 3);

  if (parts.length === 1) {
    return integer;
  }

  const decimal = (parts[1] || "").slice(0, 2);
  return `${integer}.${decimal}`;
}

function parseNumber(value) {
  return Number(String(value).replace(/,/g, "")) || 0;
}

function formatCurrency(value) {
  return `${numberFormatter.format(Math.round(value || 0))}원`;
}

function formatPercent(value) {
  return `${percentFormatter.format(value || 0)}%`;
}

function formatUpdatedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDefaultTier(platform) {
  const tiers = platform?.tiers || [];
  return tiers.find((tier) => tier.is_default) || tiers[0] || null;
}

function getSelectedTier(platform, selectedTierId) {
  if (!platform) return null;
  const tiers = platform.tiers || [];

  return (
    tiers.find((tier) => String(tier.id) === String(selectedTierId)) ||
    getDefaultTier(platform)
  );
}

function getTierTitle(tier) {
  if (!tier) return "";
  if (tier.tier_label?.trim()) return tier.tier_label.trim();

  const min = Number(tier.delivery_min || 0);
  const max = Number(tier.delivery_max || 0);

  if (min && max) {
    return `월 ${numberFormatter.format(min)}원 - ${numberFormatter.format(max)}원`;
  }
  if (min) {
    return `월 ${numberFormatter.format(min)}원 이상`;
  }

  return "기본 구간";
}

function getTierDescription(tier) {
  if (!tier) return "";

  const parts = [`중개 ${formatPercent(Number(tier.fee_rate || 0))}`];
  const paymentRate = Number(tier.payment_fee_rate || 0);

  if (paymentRate) {
    parts.push(`결제 ${formatPercent(paymentRate)}`);
  }

  parts.push(tier.vat_included ? "부가세 포함" : "부가세 별도");
  return parts.join(" · ");
}

function getTierBadge(tier) {
  if (!tier) return "";
  if (tier.is_default) return "기본";
  if (tier.memo?.trim()) return tier.memo.trim();
  return "";
}

function getPlatformTotalRate(platform) {
  const tier = getDefaultTier(platform);
  if (!tier) return null;
  return Number(tier.fee_rate || 0) + Number(tier.payment_fee_rate || 0);
}

function getMarginTone(rate) {
  if (rate >= 25) {
    return { label: "건강한 구조", toneClass: styles.ratePositive };
  }
  if (rate >= 12) {
    return { label: "안정권", toneClass: styles.rateNeutral };
  }
  if (rate >= 0) {
    return { label: "타이트함", toneClass: styles.rateCaution };
  }
  return { label: "손실 구간", toneClass: styles.rateWarning };
}

function getMarginStory(calc) {
  if (!calc) {
    return {
      title: "판매가를 입력하면 결과가 열립니다.",
      description: "현재 수수료 조건을 반영한 예상 실마진이 바로 계산됩니다.",
      action: "메뉴 판매가부터 입력해보세요.",
    };
  }

  if (calc.marginRate >= 25) {
    return {
      title: "현재 구조는 비교적 안정적입니다.",
      description:
        "원가와 수수료를 감안해도 마진 여유가 남는 편입니다. 판매가를 크게 흔들지 않아도 운영 판단이 가능합니다.",
      action: "앱별 비교에서 가장 유리한 플랫폼 차이도 함께 확인해보세요.",
    };
  }

  if (calc.marginRate >= 12) {
    return {
      title: "운영 가능한 수준이지만 여유는 크지 않습니다.",
      description:
        "광고비나 쿠폰 부담이 추가되면 체감 마진이 빠르게 줄 수 있는 구간입니다.",
      action: "배달비 부담이나 원가 항목을 먼저 다시 점검하는 편이 안전합니다.",
    };
  }

  if (calc.marginRate >= 0) {
    return {
      title: "남기기는 하지만 구조가 타이트합니다.",
      description:
        "정산 오차나 추가 비용이 붙으면 실제 체감 수익이 기대보다 낮아질 수 있습니다.",
      action: "판매가 조정이나 원가 절감 여지가 있는 메뉴인지 확인해보세요.",
    };
  }

  return {
    title: "현재 조건에서는 손실이 예상됩니다.",
    description:
      "한 건을 팔수록 손실이 누적될 수 있는 구간입니다. 판매가와 수수료 구조를 바로 다시 보는 편이 좋습니다.",
    action: "직접 입력 모드나 다른 앱 조건으로 즉시 비교해보세요.",
  };
}

function buildShareText({
  platformName,
  tierName,
  calc,
  cardFeeOn,
  vatOn,
  dailyOrders,
  projection,
}) {
  const lines = [
    "실마진 계산 결과",
    tierName ? `${platformName} · ${tierName}` : platformName,
    `판매가 ${formatCurrency(calc.price)}`,
    `예상 마진 ${formatCurrency(calc.margin)} (${formatPercent(calc.marginRate)})`,
    `앱 수수료 ${formatCurrency(calc.appFee)}`,
    `원가 ${formatCurrency(calc.cost)}`,
    `배달비 부담 ${formatCurrency(calc.delivery)}`,
    `카드 수수료 ${cardFeeOn ? formatCurrency(calc.cardFee) : "미포함"}`,
    `부가세 ${vatOn ? formatCurrency(calc.vatAmount) : "미포함"}`,
  ];

  if (dailyOrders && projection) {
    lines.push(`일 ${dailyOrders}건 기준 월 예상 ${formatCurrency(projection.monthlyMargin)}`);
  }

  lines.push("LOUNGE 실마진 계산기");
  return lines.join("\n");
}

function SectionHeader({ step, title, description }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionBadge}>{step}</span>
      <div className={styles.sectionHeaderCopy}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  suffix = "원",
  help,
  compact = false,
  primary = false,
}) {
  return (
    <label
      className={`${styles.fieldGroup} ${compact ? styles.fieldGroupCompact : ""} ${
        primary ? styles.fieldGroupPrimary : ""
      }`}
    >
      <span className={styles.fieldLabelWrap}>
        <span className={styles.fieldLabel}>{label}</span>
        {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      </span>
      <span className={styles.fieldInputShell}>
        <input
          type="text"
          inputMode="numeric"
          className={styles.fieldInput}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <span className={styles.fieldSuffix}>{suffix}</span>
      </span>
      {help ? <span className={styles.fieldHelp}>{help}</span> : null}
    </label>
  );
}

function PlatformCard({ platform, active, displayRate, onSelect }) {
  const logoSrc = PLATFORM_LOGOS[platform.platform_id];
  const isCustom = platform.platform_id === "custom";

  return (
    <button
      type="button"
      className={`${styles.platformCard} ${active ? styles.platformCardActive : ""}`}
      onClick={onSelect}
    >
      <span className={styles.platformCardIndicator}>{active ? "선택 중" : " "}</span>
      <span className={styles.platformCardBody}>
        <span className={styles.platformLogoBox}>
          {logoSrc ? (
            <img className={styles.platformLogo} src={logoSrc} alt={platform.name} />
          ) : (
            <span className={styles.platformFallback}>
              {isCustom ? "%" : platform.name.slice(0, 1)}
            </span>
          )}
        </span>
        <span className={styles.platformCopy}>
          <span className={styles.platformName}>{platform.name}</span>
          <span className={styles.platformCaption}>
            {isCustom
              ? "수수료를 직접 입력"
              : displayRate !== null
                ? `기본 총 수수료 ${formatPercent(displayRate)}`
                : "수수료 정보 준비 중"}
          </span>
        </span>
      </span>
    </button>
  );
}

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingCopy}>
        <div className={styles.settingLabel}>{label}</div>
        <div className={styles.settingDescription}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.switch} ${checked ? styles.switchActive : ""}`}
        onClick={onToggle}
      >
        <span className={styles.switchThumb} />
      </button>
    </div>
  );
}

export default function DeliveryMarginCalculator() {
  const [platforms, setPlatforms] = useState([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [platformError, setPlatformError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [selectedPlatformId, setSelectedPlatformId] = useState("baemin");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [customFee, setCustomFee] = useState("");

  const [menuPrice, setMenuPrice] = useState("");
  const [menuCost, setMenuCost] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [cardFeeOn, setCardFeeOn] = useState(true);
  const [vatOn, setVatOn] = useState(false);

  const [dailyOrders, setDailyOrders] = useState("");
  const [fixedCost, setFixedCost] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const [analysisIndustry, setAnalysisIndustry] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlatforms() {
      setLoadingPlatforms(true);
      setPlatformError("");

      try {
        const response = await fetch("/api/delivery-fees");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "수수료 정보를 불러오지 못했습니다.");
        }

        if (cancelled) return;

        setPlatforms(Array.isArray(data.data) ? data.data : []);
        setLastUpdated(data.lastUpdated || "");

        if (!data.data?.length) {
          setPlatformError("활성화된 수수료 데이터가 없어 직접 입력 모드로만 계산할 수 있습니다.");
        }
      } catch (error) {
        if (cancelled) return;
        setPlatforms([]);
        setPlatformError(error.message || "수수료 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setLoadingPlatforms(false);
        }
      }
    }

    loadPlatforms();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadingPlatforms && !platforms.length && selectedPlatformId !== "custom") {
      setSelectedPlatformId("custom");
    }
  }, [loadingPlatforms, platforms, selectedPlatformId]);

  useEffect(() => {
    if (!platforms.length || selectedPlatformId === "custom") return;

    const hasSelectedPlatform = platforms.some(
      (platform) => platform.platform_id === selectedPlatformId,
    );

    if (!hasSelectedPlatform) {
      setSelectedPlatformId(platforms[0].platform_id);
    }
  }, [platforms, selectedPlatformId]);

  const selectedPlatform = useMemo(
    () => platforms.find((platform) => platform.platform_id === selectedPlatformId) || null,
    [platforms, selectedPlatformId],
  );

  useEffect(() => {
    if (selectedPlatformId === "custom") {
      if (selectedTierId) setSelectedTierId("");
      return;
    }

    if (!selectedPlatform) return;

    const nextTier = getSelectedTier(selectedPlatform, selectedTierId);
    const nextTierId = nextTier ? String(nextTier.id) : "";

    if (String(selectedTierId || "") !== nextTierId) {
      setSelectedTierId(nextTierId);
    }
  }, [selectedPlatform, selectedPlatformId, selectedTierId]);

  useEffect(() => {
    setAnalysisError("");
    setAnalysisResult(null);
  }, [selectedPlatformId, selectedTierId, customFee, menuPrice, menuCost, deliveryFee, cardFeeOn, vatOn]);

  const selectedTier = useMemo(() => {
    if (selectedPlatformId === "custom") return null;
    return getSelectedTier(selectedPlatform, selectedTierId);
  }, [selectedPlatform, selectedPlatformId, selectedTierId]);

  const appFeeRate =
    selectedPlatformId === "custom"
      ? Number(customFee) || 0
      : Number(selectedTier?.fee_rate || 0);

  const paymentFeeRate = cardFeeOn
    ? selectedPlatformId === "custom"
      ? 1.5
      : Number(selectedTier?.payment_fee_rate || 0)
    : 0;

  const totalFeeRate = appFeeRate + paymentFeeRate;

  const calc = useMemo(() => {
    const price = parseNumber(menuPrice);
    if (!price) return null;

    const cost = parseNumber(menuCost);
    const delivery = parseNumber(deliveryFee);
    const appFee = Math.round((price * appFeeRate) / 100);
    const cardFee = Math.round((price * paymentFeeRate) / 100);
    const vatAmount = vatOn ? Math.round(price * 0.1) : 0;
    const totalDeductions = cost + delivery + appFee + cardFee + vatAmount;
    const margin = price - totalDeductions;
    const marginRate = price > 0 ? (margin / price) * 100 : 0;
    const costRate = price > 0 ? (cost / price) * 100 : 0;
    const feeRate = price > 0 ? ((appFee + cardFee) / price) * 100 : 0;
    const extraRate = price > 0 ? ((delivery + vatAmount) / price) * 100 : 0;
    const contributionPerTenThousand = price > 0 ? (margin / price) * 10000 : 0;

    return {
      price,
      cost,
      delivery,
      appFee,
      cardFee,
      vatAmount,
      totalDeductions,
      margin,
      marginRate,
      costRate,
      feeRate,
      extraRate,
      contributionPerTenThousand,
    };
  }, [menuPrice, menuCost, deliveryFee, appFeeRate, paymentFeeRate, vatOn]);

  const meterSegments = useMemo(() => {
    if (!calc) return [];

    const base = Math.max(calc.price, calc.totalDeductions || 0);
    if (!base) return [];

    return [
      { key: "cost", value: calc.cost, color: "#dae2f0" },
      { key: "fees", value: calc.appFee + calc.cardFee, color: "#b8caeb" },
      { key: "extra", value: calc.delivery + calc.vatAmount, color: "#e7edf7" },
      { key: "margin", value: Math.max(calc.margin, 0), color: "#1b4797" },
    ]
      .filter((segment) => segment.value > 0)
      .map((segment) => ({
        ...segment,
        width: `${(segment.value / base) * 100}%`,
      }));
  }, [calc]);

  const comparison = useMemo(() => {
    if (!calc || !platforms.length) return [];

    return platforms
      .map((platform) => {
        const defaultTier = getDefaultTier(platform);
        if (!defaultTier) return null;

        const feeRate = Number(defaultTier.fee_rate || 0);
        const payRate = cardFeeOn ? Number(defaultTier.payment_fee_rate || 0) : 0;
        const appFee = Math.round((calc.price * feeRate) / 100);
        const cardFee = Math.round((calc.price * payRate) / 100);
        const vatAmount = vatOn ? Math.round(calc.price * 0.1) : 0;
        const margin =
          calc.price - calc.cost - calc.delivery - appFee - cardFee - vatAmount;

        return {
          platformId: platform.platform_id,
          name: platform.name,
          margin,
          marginRate: calc.price > 0 ? (margin / calc.price) * 100 : 0,
          totalRate: feeRate + payRate,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.margin - left.margin);
  }, [calc, platforms, cardFeeOn, vatOn]);

  const currentComparison = useMemo(
    () => comparison.find((item) => item.platformId === selectedPlatformId) || null,
    [comparison, selectedPlatformId],
  );

  const bestComparison = comparison[0] || null;

  const projection = useMemo(() => {
    const orders = parseNumber(dailyOrders);
    if (!calc || !orders) return null;

    return {
      orders,
      dailyMargin: calc.margin * orders,
      weeklyMargin: calc.margin * orders * 7,
      monthlyMargin: calc.margin * orders * 30,
    };
  }, [calc, dailyOrders]);

  const breakEvenOrders = useMemo(() => {
    const fixed = parseNumber(fixedCost);
    if (!calc || calc.margin <= 0 || !fixed) return null;
    return Math.ceil(fixed / calc.margin);
  }, [calc, fixedCost]);

  const selectedPlatformName = selectedPlatform?.name || "직접 입력";
  const selectedTierName =
    selectedPlatformId === "custom" ? "수수료 직접 입력" : getTierTitle(selectedTier);
  const resultTone = calc ? getMarginTone(calc.marginRate) : null;
  const resultStory = getMarginStory(calc);

  const ratioCards = calc
    ? [
        { label: "원가율", value: formatPercent(calc.costRate), className: styles.ratioCardGray },
        { label: "수수료율", value: formatPercent(calc.feeRate), className: styles.ratioCardBlue },
        { label: "기타 비용", value: formatPercent(calc.extraRate), className: styles.ratioCardSoft },
        { label: "마진율", value: formatPercent(calc.marginRate), className: styles.ratioCardStrong },
      ]
    : [];

  const presetItems = [
    { label: "배달앱", value: selectedPlatformName },
    { label: "매출 구간", value: selectedTierName || "기본 구간" },
    { label: "총 수수료", value: formatPercent(totalFeeRate) },
    {
      label: "설정",
      value: `${cardFeeOn ? "카드 포함" : "카드 제외"} · ${vatOn ? "부가세 포함" : "부가세 제외"}`,
    },
  ];

  const previewRows = [
    { label: "판매가", value: calc ? formatCurrency(calc.price) : "입력 대기" },
    { label: "총 차감액", value: calc ? formatCurrency(calc.totalDeductions) : "자동 계산" },
    { label: "남는 금액", value: calc ? formatCurrency(calc.margin) : "결과 확인", emphasis: true },
  ];

  function handleNumericChange(setter) {
    return (event) => {
      setter(formatNumberInput(event.target.value));
    };
  }

  async function handleShare() {
    if (!calc) return;

    const text = buildShareText({
      platformName: selectedPlatformName,
      tierName: selectedTierName,
      calc,
      cardFeeOn,
      vatOn,
      dailyOrders,
      projection,
    });

    try {
      if (navigator.share) {
        await navigator.share({ title: "실마진 계산 결과", text });
        setShareMessage("공유 창을 열었습니다.");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("결과를 클립보드에 복사했습니다.");
      }
    } catch {
      setShareMessage("공유를 취소했습니다.");
    }

    window.setTimeout(() => setShareMessage(""), 2200);
  }

  async function handleAnalyze() {
    if (!calc) return;

    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/tools/margin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatformName,
          feeRate: totalFeeRate,
          menuPrice: calc.price,
          menuCost: calc.cost,
          deliveryFee: calc.delivery,
          marginRate: calc.marginRate,
          margin: calc.margin,
          industry: analysisIndustry,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI 분석을 불러오지 못했습니다.");
      }

      setAnalysisResult(data.data);
    } catch (error) {
      setAnalysisError(error.message || "AI 분석을 불러오지 못했습니다.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <>
      <div className={styles.page}>
        <section className={`${styles.card} ${styles.heroCard}`}>
          <div className={styles.heroTopRow}>
            <span className={styles.heroBadge}>실시간 수수료 반영</span>
            <span className={styles.heroUpdated}>
              {lastUpdated ? `업데이트 ${formatUpdatedDate(lastUpdated)}` : "기본 수수료 불러오는 중"}
            </span>
          </div>

          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>실마진 계산기</h1>
              <p className={styles.heroDescription}>
                배달앱, 매출 구간, 메뉴 원가를 조합해 메뉴 1건당 실제로 남는 금액을
                빠르게 읽을 수 있게 만든 모바일용 계산 도구입니다.
              </p>
              <div className={styles.heroChipRow}>
                <span className={styles.heroChip}>앱별 비교</span>
                <span className={styles.heroChip}>즉시 계산</span>
                <span className={styles.heroChip}>정산 전 점검</span>
              </div>
            </div>

            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.previewLabel}>현재 계산 미리보기</span>
                <span className={styles.previewPlatform}>{selectedPlatformName}</span>
              </div>
              <div className={styles.previewRows}>
                {previewRows.map((row) => (
                  <div key={row.label} className={styles.previewRow}>
                    <span className={styles.previewRowLabel}>{row.label}</span>
                    <strong
                      className={`${styles.previewRowValue} ${
                        row.emphasis ? styles.previewRowValueStrong : ""
                      }`}
                    >
                      {row.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {platformError ? (
          <div className={`${styles.notice} ${styles.noticeWarning}`}>{platformError}</div>
        ) : null}

        <section className={`${styles.card} ${styles.presetCard}`}>
          <div className={styles.presetHeader}>
            <div className={styles.presetTitle}>현재 계산 조건</div>
            <div className={styles.presetDescription}>
              선택 상태를 한 줄로 요약해 보고 계산 흐름을 잃지 않도록 구성했습니다.
            </div>
          </div>
          <div className={styles.presetGrid}>
            {presetItems.map((item) => (
              <div key={item.label} className={styles.presetItem}>
                <span className={styles.presetLabel}>{item.label}</span>
                <strong className={styles.presetValue}>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <SectionHeader
            step="STEP 1"
            title="배달앱 선택"
            description="자주 쓰는 앱을 고르면 해당 기본 수수료가 자동으로 채워집니다."
          />

          {loadingPlatforms ? (
            <div className={styles.platformGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.platformSkeleton} />
              ))}
            </div>
          ) : (
            <>
              <div className={styles.platformGrid}>
                {[...platforms, { platform_id: "custom", name: "직접 입력" }].map((platform) => (
                  <PlatformCard
                    key={platform.platform_id}
                    platform={platform}
                    active={selectedPlatformId === platform.platform_id}
                    displayRate={
                      platform.platform_id === "custom"
                        ? null
                        : getPlatformTotalRate(platform)
                    }
                    onSelect={() => setSelectedPlatformId(platform.platform_id)}
                  />
                ))}
              </div>

              {selectedPlatformId === "custom" ? (
                <div className={styles.inlineFieldCard}>
                  <div className={styles.inlineFieldHeader}>
                    <div className={styles.inlineFieldTitle}>직접 수수료 입력</div>
                    <div className={styles.inlineFieldDescription}>
                      중개 수수료를 직접 입력하고, 결제 수수료는 설정 토글에 맞춰 별도로
                      반영합니다.
                    </div>
                  </div>
                  <div className={styles.percentFieldShell}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={styles.percentField}
                      value={customFee}
                      onChange={(event) =>
                        setCustomFee(sanitizePercentInput(event.target.value))
                      }
                      placeholder="예: 7.8"
                    />
                    <span className={styles.percentSuffix}>%</span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        {selectedPlatformId !== "custom" && selectedPlatform ? (
          <section className={styles.card}>
            <SectionHeader
              step="STEP 2"
              title="매출 구간 선택"
              description="월 매출 구간별 수수료 차이를 카드형으로 정리해 빠르게 비교할 수 있습니다."
            />

            <div className={styles.tierList}>
              {(selectedPlatform.tiers || []).map((tier) => {
                const active = String(tier.id) === String(selectedTierId);
                const badge = getTierBadge(tier);

                return (
                  <button
                    key={tier.id}
                    type="button"
                    className={`${styles.tierCard} ${active ? styles.tierCardActive : ""}`}
                    onClick={() => setSelectedTierId(String(tier.id))}
                  >
                    <div className={styles.tierTop}>
                      <div>
                        <div className={styles.tierTitle}>{getTierTitle(tier)}</div>
                        <div className={styles.tierDescription}>{getTierDescription(tier)}</div>
                      </div>
                      {badge ? <span className={styles.tierBadge}>{badge}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className={styles.card}>
          <SectionHeader
            step={selectedPlatformId === "custom" ? "STEP 2" : "STEP 3"}
            title="핵심 입력"
            description="판매가를 가장 크게 두고, 실제 판단에 필요한 원가와 배달비 부담을 바로 이어서 넣게 했습니다."
          />

          <div className={styles.inputLead}>
            <div className={styles.inputLeadTitle}>메뉴 1건 기준</div>
            <div className={styles.inputLeadDescription}>
              가장 자주 입력하는 숫자만 먼저 배치해서 계산 자체가 빠르고 편하게 느껴지도록 정리했습니다.
            </div>
          </div>

          <div className={styles.fieldStack}>
            <NumberField
              primary
              label="메뉴 판매가"
              hint="고객 결제 금액 기준"
              value={menuPrice}
              onChange={handleNumericChange(setMenuPrice)}
              placeholder="예: 18,000"
              help="판매가를 입력하면 결과 카드가 즉시 활성화됩니다."
            />

            <div className={styles.compactFieldGrid}>
              <NumberField
                compact
                label="메뉴 원가"
                hint="재료비 + 포장비"
                value={menuCost}
                onChange={handleNumericChange(setMenuCost)}
                placeholder="예: 6,500"
              />
              <NumberField
                compact
                label="배달비 부담"
                hint="사장님 부담 금액"
                value={deliveryFee}
                onChange={handleNumericChange(setDeliveryFee)}
                placeholder="예: 3,000"
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <SectionHeader
            step={selectedPlatformId === "custom" ? "STEP 3" : "STEP 4"}
            title="설정"
            description="핵심 입력과 옵션성 판단을 분리해 계산기 자체가 더 가볍게 느껴지도록 정리했습니다."
          />

          <div className={styles.settingList}>
            <ToggleRow
              label="카드 수수료 포함"
              description="끄면 결제 수수료를 제외한 값으로 계산합니다."
              checked={cardFeeOn}
              onToggle={() => setCardFeeOn((value) => !value)}
            />
            <ToggleRow
              label="부가세 포함"
              description="켜면 판매가의 10%를 추가 차감 항목으로 반영합니다."
              checked={vatOn}
              onToggle={() => setVatOn((value) => !value)}
            />
          </div>

          <div className={styles.settingSummary}>
            <span>현재 반영 수수료</span>
            <strong>
              중개 {formatPercent(appFeeRate)} · 결제 {formatPercent(paymentFeeRate)}
            </strong>
          </div>
        </section>

        <section className={`${styles.card} ${styles.resultCard}`}>
          <SectionHeader
            step={selectedPlatformId === "custom" ? "STEP 4" : "STEP 5"}
            title="결과 확인"
            description="계산 결과를 수치, 구조, 해석 순으로 배치해 지금 무엇을 판단해야 하는지 바로 보이게 만들었습니다."
          />

          {!calc ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>₩</div>
              <div className={styles.emptyTitle}>판매가를 입력하면 예상 마진이 바로 표시됩니다.</div>
              <div className={styles.emptyDescription}>
                앱과 설정 조건은 이미 반영되어 있으니, 숫자만 넣으면 결과 구조가 열립니다.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.resultHeroPanel}>
                <div className={styles.resultHeroCopy}>
                  <div className={styles.resultEyebrow}>
                    {selectedPlatformName}
                    <span className={styles.resultEyebrowDivider}>·</span>
                    {selectedTierName}
                  </div>
                  <div className={styles.resultValue}>{formatCurrency(calc.margin)}</div>
                  <div className={styles.resultCaption}>메뉴 1건 판매 시 남는 예상 금액</div>
                </div>

                <div className={styles.resultHeroSide}>
                  <div className={`${styles.rateBadge} ${resultTone?.toneClass || ""}`}>
                    <span>{resultTone?.label}</span>
                    <strong>{formatPercent(calc.marginRate)}</strong>
                  </div>
                  <div className={styles.resultMiniMetric}>
                    매출 1만원당 약 {formatCurrency(calc.contributionPerTenThousand)}
                  </div>
                </div>
              </div>

              <div className={styles.resultStoryCard}>
                <div className={styles.resultStoryTitle}>{resultStory.title}</div>
                <p className={styles.resultStoryDescription}>{resultStory.description}</p>
                <div className={styles.resultStoryAction}>{resultStory.action}</div>
              </div>

              <div className={styles.ratioGrid}>
                {ratioCards.map((item) => (
                  <div key={item.label} className={`${styles.ratioCard} ${item.className}`}>
                    <span className={styles.ratioLabel}>{item.label}</span>
                    <strong className={styles.ratioValue}>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.breakdownPanel}>
                <div className={styles.panelTitle}>수익 구조</div>
                <div className={styles.meter}>
                  {meterSegments.map((segment) => (
                    <span
                      key={segment.key}
                      className={styles.meterSegment}
                      style={{ width: segment.width, backgroundColor: segment.color }}
                    />
                  ))}
                </div>
                <div className={styles.legendList}>
                  <div className={styles.legendRow}>
                    <span className={styles.legendLabel}>
                      <span className={styles.legendDot} style={{ backgroundColor: "#dae2f0" }} />
                      원가
                    </span>
                    <strong>{formatCurrency(calc.cost)}</strong>
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.legendLabel}>
                      <span className={styles.legendDot} style={{ backgroundColor: "#b8caeb" }} />
                      앱/결제 수수료
                    </span>
                    <strong>{formatCurrency(calc.appFee + calc.cardFee)}</strong>
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.legendLabel}>
                      <span className={styles.legendDot} style={{ backgroundColor: "#e7edf7" }} />
                      배달비/부가세
                    </span>
                    <strong>{formatCurrency(calc.delivery + calc.vatAmount)}</strong>
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.legendLabel}>
                      <span className={styles.legendDot} style={{ backgroundColor: "#1b4797" }} />
                      예상 마진
                    </span>
                    <strong>{formatCurrency(calc.margin)}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>앱 수수료</span>
                  <strong className={styles.metricValue}>{formatCurrency(calc.appFee)}</strong>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>카드 수수료</span>
                  <strong className={styles.metricValue}>{formatCurrency(calc.cardFee)}</strong>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>배달비 부담</span>
                  <strong className={styles.metricValue}>{formatCurrency(calc.delivery)}</strong>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>총 차감액</span>
                  <strong className={styles.metricValue}>{formatCurrency(calc.totalDeductions)}</strong>
                </div>
              </div>

              {comparison.length > 1 ? (
                <div className={styles.compareWrap}>
                  <div className={styles.compareHeader}>
                    <div className={styles.compareTitle}>앱별 비교</div>
                    <div className={styles.compareDescription}>
                      같은 판매가, 원가, 배달비 조건으로 바로 비교한 결과입니다.
                    </div>
                  </div>

                  {bestComparison && currentComparison ? (
                    <div className={styles.compareInsight}>
                      {bestComparison.platformId === currentComparison.platformId ? (
                        <span>현재 선택한 앱이 가장 높은 마진을 보여주고 있습니다.</span>
                      ) : (
                        <span>
                          현재 선택보다 <strong>{bestComparison.name}</strong>이{" "}
                          <strong>
                            {formatCurrency(bestComparison.margin - currentComparison.margin)}
                          </strong>{" "}
                          더 유리합니다.
                        </span>
                      )}
                    </div>
                  ) : null}

                  <div className={styles.compareList}>
                    {comparison.map((item, index) => {
                      const active = item.platformId === selectedPlatformId;
                      const delta =
                        currentComparison && item.platformId !== selectedPlatformId
                          ? item.margin - currentComparison.margin
                          : 0;

                      return (
                        <div
                          key={item.platformId}
                          className={`${styles.compareRow} ${
                            active ? styles.compareRowActive : ""
                          }`}
                        >
                          <div className={styles.compareRank}>{index + 1}</div>
                          <div className={styles.compareCopy}>
                            <div className={styles.compareName}>
                              {item.name}
                              {active ? (
                                <span className={styles.compareCurrent}>현재 선택</span>
                              ) : null}
                            </div>
                            <div className={styles.compareMeta}>
                              총 수수료 {formatPercent(item.totalRate)}
                              {!active && currentComparison ? (
                                <span className={styles.compareDelta}>
                                  {delta >= 0 ? "+" : ""}
                                  {formatCurrency(delta)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.compareValues}>
                            <strong className={styles.compareAmount}>
                              {formatCurrency(item.margin)}
                            </strong>
                            <span className={styles.compareRate}>
                              {formatPercent(item.marginRate)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        <details className={`${styles.card} ${styles.extraDetails}`}>
          <summary className={styles.detailsSummary}>
            <div>
              <div className={styles.detailsTitle}>추가 분석</div>
              <div className={styles.detailsDescription}>
                일 주문 수 시뮬레이션과 AI 해석은 기본 결과와 분리해 필요할 때만 열 수 있게 구성했습니다.
              </div>
            </div>
            <span className={styles.summaryChevron}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </summary>

          <div className={styles.extraContent}>
            <div className={styles.subsectionTitle}>일 주문 수 시뮬레이션</div>
            <div className={styles.compactFieldGrid}>
              <NumberField
                compact
                label="일 주문 수"
                hint="선택 입력"
                value={dailyOrders}
                onChange={handleNumericChange(setDailyOrders)}
                placeholder="예: 25"
                suffix="건"
              />
              <NumberField
                compact
                label="월 고정비"
                hint="임차료, 인건비"
                value={fixedCost}
                onChange={handleNumericChange(setFixedCost)}
                placeholder="예: 2,000,000"
              />
            </div>

            {projection ? (
              <div className={styles.projectionGrid}>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>하루 예상</span>
                  <strong className={styles.projectionValue}>
                    {formatCurrency(projection.dailyMargin)}
                  </strong>
                </div>
                <div className={styles.projectionCard}>
                  <span className={styles.projectionLabel}>일주일 예상</span>
                  <strong className={styles.projectionValue}>
                    {formatCurrency(projection.weeklyMargin)}
                  </strong>
                </div>
                <div className={`${styles.projectionCard} ${styles.projectionCardWide}`}>
                  <span className={styles.projectionLabel}>한 달 예상</span>
                  <strong className={styles.projectionValue}>
                    {formatCurrency(projection.monthlyMargin)}
                  </strong>
                </div>
              </div>
            ) : (
              <div className={styles.helperNote}>
                일 주문 수를 넣으면 하루, 일주일, 한 달 기준 추정 수익을 함께 볼 수 있습니다.
              </div>
            )}

            {breakEvenOrders ? (
              <div className={styles.breakEvenBox}>
                월 고정비 {formatCurrency(parseNumber(fixedCost))}를 회수하려면 현재 조건에서
                약 <strong>{numberFormatter.format(breakEvenOrders)}건</strong>의 주문이 필요합니다.
              </div>
            ) : null}

            <div className={styles.subsectionTitle}>AI 마진 해석</div>
            <div className={styles.chipRow}>
              {ANALYSIS_INDUSTRIES.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  className={`${styles.industryChip} ${
                    analysisIndustry === industry ? styles.industryChipActive : ""
                  }`}
                  onClick={() =>
                    setAnalysisIndustry((current) => (current === industry ? "" : industry))
                  }
                >
                  {industry}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`${styles.primaryButton} ${!calc ? styles.buttonDisabled : ""}`}
              onClick={handleAnalyze}
              disabled={!calc || analysisLoading}
            >
              {analysisLoading ? "AI 분석 불러오는 중..." : "AI로 결과 해석하기"}
            </button>

            {analysisError ? <div className={styles.notice}>{analysisError}</div> : null}

            {analysisResult ? (
              <div className={styles.analysisBox}>
                <div className={styles.analysisHeader}>
                  <span>AI 분석 결과</span>
                  {analysisResult.cached ? (
                    <span className={styles.analysisCached}>캐시</span>
                  ) : null}
                </div>
                <p className={styles.analysisText}>{analysisResult.text}</p>
                <p className={styles.analysisNote}>
                  AI 해석은 참고용입니다. 실제 정산서는 광고비, 쿠폰, 프로모션 정책에 따라 달라질 수 있습니다.
                </p>
              </div>
            ) : null}
          </div>
        </details>
      </div>

      {calc ? (
        <div className={styles.floatingSummary}>
          <div className={styles.floatingSummaryCopy}>
            <span className={styles.floatingSummaryLabel}>현재 예상 마진</span>
            <strong className={styles.floatingSummaryValue}>{formatCurrency(calc.margin)}</strong>
          </div>
          <button type="button" className={styles.floatingSummaryButton} onClick={handleShare}>
            공유
          </button>
        </div>
      ) : null}

      {shareMessage ? (
        <div className={styles.toast} aria-live="polite">
          {shareMessage}
        </div>
      ) : null}
    </>
  );
}
