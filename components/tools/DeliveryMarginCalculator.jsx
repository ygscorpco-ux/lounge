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

function formatSignedCurrency(value) {
  const rounded = Math.round(value || 0);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${numberFormatter.format(rounded)}원`;
}

function formatPercent(value) {
  return `${percentFormatter.format(value || 0)}%`;
}

function formatUpdatedDate(value) {
  const today = new Date();
  const parsed = value ? new Date(value) : today;
  const safeDate = Number.isNaN(parsed.getTime()) ? today : parsed;
  const displayDate = safeDate > today ? safeDate : today;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  })
    .format(displayDate)
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
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

function getTierBadge(tier) {
  if (!tier) return "";
  if (tier.is_default) return "기본";
  if (tier.memo?.trim()) return tier.memo.trim();
  return "";
}

function getTierMetaItems(tier) {
  if (!tier) return [];

  const items = [`중개 ${formatPercent(Number(tier.fee_rate || 0))}`];
  const paymentRate = Number(tier.payment_fee_rate || 0);

  if (paymentRate) {
    items.push(`결제 ${formatPercent(paymentRate)}`);
  }

  items.push(tier.vat_included ? "부가세 포함" : "부가세 별도");
  return items;
}

function getMarginTone(rate) {
  if (rate >= 25) {
    return {
      label: "좋음",
      icon: "▲",
      badgeClass: styles.ratePositive,
      insightClass: styles.resultInsightPositive,
      headline: "현재 가격이면 메뉴 1건당 마진이 비교적 안정적으로 남습니다.",
      action: "앱별 비교에서 더 유리한 조건도 함께 확인해보세요.",
    };
  }
  if (rate >= 12) {
    return {
      label: "보통",
      icon: "●",
      badgeClass: styles.rateNeutral,
      insightClass: styles.resultInsightNeutral,
      headline: "운영은 가능하지만 여유가 넉넉한 구간은 아닙니다.",
      action: "원가나 배달비를 함께 확인하면 판단이 더 쉬워집니다.",
    };
  }
  if (rate >= 0) {
    return {
      label: "주의",
      icon: "!",
      badgeClass: styles.rateCaution,
      insightClass: styles.resultInsightCaution,
      headline: "남기는 금액은 있지만 실제 체감 마진은 빠듯할 수 있습니다.",
      action: "판매가와 비용을 조금만 바꿔도 결과가 크게 달라질 수 있습니다.",
    };
  }
  return {
    label: "손실",
    icon: "−",
    badgeClass: styles.rateWarning,
    insightClass: styles.resultInsightWarning,
    headline: "현재 가격이면 메뉴 1건당 손실이 발생하는 구조입니다.",
    action: "판매가, 원가, 앱 조건을 다시 넣어 바로 비교해보세요.",
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

function parseBooleanParam(value, fallback) {
  if (value == null) return fallback;
  return value === "1" || value === "true";
}

function SectionHeader({ step, title, description }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionBadge}>{step}</span>
      <div className={styles.sectionHeaderCopy}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
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

function PlatformCard({ platform, active, onSelect }) {
  const logoSrc = PLATFORM_LOGOS[platform.platform_id];

  return (
    <button
      type="button"
      className={`${styles.platformCard} ${active ? styles.platformCardActive : ""}`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={platform.name}
      title={platform.name}
    >
      <span className={styles.platformLogoStage}>
        <span className={styles.platformLogoBox}>
          {logoSrc ? (
            <img
              className={styles.platformLogo}
              src={logoSrc}
              alt={platform.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={styles.platformFallback}>{platform.name.slice(0, 1)}</span>
          )}
        </span>
      </span>
    </button>
  );
}

function CustomPlatformCard({ active, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.platformWideCard} ${active ? styles.platformWideCardActive : ""}`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label="직접 입력"
      title="직접 입력"
    >
      <span className={styles.platformWideMain}>
        <span className={styles.platformWideIcon}>
          <span className={styles.platformFallback}>%</span>
        </span>
        <span className={styles.platformWideLabel}>
          <span>직접입력</span>
          <span className={styles.platformWideAccent} aria-hidden="true">
            ✏️
          </span>
        </span>
      </span>
    </button>
  );
}

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <div className={styles.settingRow}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.switch} ${checked ? styles.switchActive : ""}`}
        onClick={onToggle}
      >
        <span className={styles.switchThumb} />
      </button>
      <div className={styles.settingCopy}>
        <div className={styles.settingLabel}>{label}</div>
        <div className={styles.settingDescription}>{description}</div>
      </div>
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
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;

    const platformParam = params.get("platform");
    const tierParam = params.get("tier");
    const customFeeParam = params.get("customFee");
    const menuPriceParam = params.get("menuPrice");
    const menuCostParam = params.get("menuCost");
    const deliveryFeeParam = params.get("deliveryFee");
    const dailyOrdersParam = params.get("dailyOrders");
    const fixedCostParam = params.get("fixedCost");
    const industryParam = params.get("industry");

    if (platformParam) setSelectedPlatformId(platformParam);
    if (tierParam) setSelectedTierId(tierParam);
    if (customFeeParam) setCustomFee(sanitizePercentInput(customFeeParam));
    if (menuPriceParam) setMenuPrice(formatNumberInput(menuPriceParam));
    if (menuCostParam) setMenuCost(formatNumberInput(menuCostParam));
    if (deliveryFeeParam) setDeliveryFee(formatNumberInput(deliveryFeeParam));
    if (dailyOrdersParam) setDailyOrders(formatNumberInput(dailyOrdersParam));
    if (fixedCostParam) setFixedCost(formatNumberInput(fixedCostParam));

    setCardFeeOn(parseBooleanParam(params.get("cardFeeOn"), true));
    setVatOn(parseBooleanParam(params.get("vatOn"), false));

    if (industryParam && ANALYSIS_INDUSTRIES.includes(industryParam)) {
      setAnalysisIndustry(industryParam);
    }
  }, []);

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
      { key: "cost", value: calc.cost, color: "#C7D2E3" },
      { key: "fees", value: calc.appFee + calc.cardFee, color: "#6F96DA" },
      { key: "extra", value: calc.delivery + calc.vatAmount, color: "#F1B24A" },
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
  const compareHeadline =
    bestComparison && currentComparison
      ? bestComparison.platformId === currentComparison.platformId
        ? "현재 선택한 앱이 가장 많이 남습니다."
        : `${bestComparison.name}이 현재보다 ${formatCurrency(bestComparison.margin - currentComparison.margin)} 더 남아요.`
      : bestComparison
        ? `${bestComparison.name} 기준이 가장 유리하게 계산됩니다.`
        : "같은 메뉴 조건으로 앱별 실마진을 비교합니다.";

  const resultFacts = calc
    ? [
        {
          label: calc.margin >= 0 ? "손익률" : "손실률",
          value: formatPercent(calc.marginRate),
          note: resultTone?.label || "",
          className: calc.margin >= 0 ? styles.factCardStrong : styles.factCardAlert,
        },
        {
          label: calc.margin >= 0 ? "매출 1만원당 남는 돈" : "매출 1만원당 손실",
          value: formatCurrency(calc.contributionPerTenThousand),
          note: "매출 기준 체감 수익",
          className: styles.factCardBlue,
        },
        {
          label: "총 차감액",
          value: formatCurrency(calc.totalDeductions),
          note: "판매가에서 빠지는 금액",
          className: styles.factCardNeutral,
        },
        {
          label: "앱/결제 수수료",
          value: formatCurrency(calc.appFee + calc.cardFee),
          note: `총 수수료 ${formatPercent(calc.feeRate)}`,
          className: styles.factCardSoft,
        },
      ]
    : [];

  const breakdownItems = calc
    ? [
        {
          label: "원가",
          value: calc.cost,
          share: formatPercent(calc.costRate),
          color: "#C7D2E3",
          className: styles.breakdownRowCost,
        },
        {
          label: "앱/결제 수수료",
          value: calc.appFee + calc.cardFee,
          share: formatPercent(calc.feeRate),
          color: "#6F96DA",
          className: styles.breakdownRowFees,
        },
        {
          label: "배달비 · 부가세",
          value: calc.delivery + calc.vatAmount,
          share: formatPercent(calc.extraRate),
          color: "#F1B24A",
          className: styles.breakdownRowExtra,
        },
        {
          label: calc.margin >= 0 ? "예상 마진" : "예상 손실",
          value: calc.margin,
          share: formatPercent(calc.marginRate),
          color: calc.margin >= 0 ? "#1b4797" : "#d9554d",
          className:
            calc.margin >= 0 ? styles.breakdownRowMargin : styles.breakdownRowLoss,
        },
      ]
    : [];

  function handleNumericChange(setter) {
    return (event) => {
      setter(formatNumberInput(event.target.value));
    };
  }

  function buildShareUrl() {
    if (typeof window === "undefined") return "";

    const url = new URL(window.location.pathname, window.location.origin);
    const params = url.searchParams;

    params.set("platform", selectedPlatformId);
    if (selectedPlatformId !== "custom" && selectedTierId) {
      params.set("tier", selectedTierId);
    }
    if (selectedPlatformId === "custom" && customFee) {
      params.set("customFee", sanitizePercentInput(customFee));
    }

    const price = parseNumber(menuPrice);
    const cost = parseNumber(menuCost);
    const delivery = parseNumber(deliveryFee);
    const orders = parseNumber(dailyOrders);
    const fixed = parseNumber(fixedCost);

    if (price) params.set("menuPrice", String(price));
    if (cost) params.set("menuCost", String(cost));
    if (delivery) params.set("deliveryFee", String(delivery));
    if (orders) params.set("dailyOrders", String(orders));
    if (fixed) params.set("fixedCost", String(fixed));

    params.set("cardFeeOn", cardFeeOn ? "1" : "0");
    params.set("vatOn", vatOn ? "1" : "0");

    if (analysisIndustry) {
      params.set("industry", analysisIndustry);
    }

    return url.toString();
  }

  async function handleShare() {
    if (!calc) return;

    const shareUrl = buildShareUrl();
    const text = buildShareText({
      platformName: selectedPlatformName,
      tierName: selectedTierName,
      calc,
      cardFeeOn,
      vatOn,
      dailyOrders,
      projection,
    });

    let copied = false;
    try {
      if (navigator.clipboard?.writeText && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }

      if (navigator.share && shareUrl) {
        await navigator.share({
          title: "실마진 계산 결과",
          text,
          url: shareUrl,
        });
        setShareMessage("공유 창을 열었습니다.");
      } else {
        setShareMessage(
          copied ? "현재 입력값이 담긴 링크를 복사했습니다." : "링크를 만들지 못했습니다.",
        );
      }
    } catch {
      setShareMessage(
        copied ? "현재 입력값이 담긴 링크를 복사했습니다." : "공유를 취소했습니다.",
      );
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
              {lastUpdated ? `업데이트 ${formatUpdatedDate(lastUpdated)}` : "업데이트 03.06"}
            </span>
          </div>

          <div className={styles.heroMain}>
            <h1 className={styles.heroTitle}>실마진 계산기</h1>
            <p className={styles.heroDescription}>
              메뉴 1개 팔았을 때 실제로 남는 금액을 앱별로 바로 확인해보세요.
            </p>
          </div>
        </section>

        {platformError ? (
          <div className={`${styles.notice} ${styles.noticeWarning}`}>{platformError}</div>
        ) : null}

        <section className={styles.card}>
          <SectionHeader
            step="STEP 1"
            title="배달앱 선택"
            description="자주 쓰는 앱을 고르면 기본 수수료가 바로 들어갑니다."
          />

          {loadingPlatforms ? (
            <>
              <div className={styles.platformGrid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={styles.platformSkeleton} />
                ))}
              </div>
              <div className={`${styles.platformSkeleton} ${styles.platformWideSkeleton}`} />
            </>
          ) : (
            <>
              <div className={styles.platformGrid}>
                {platforms.map((platform) => (
                  <PlatformCard
                    key={platform.platform_id}
                    platform={platform}
                    active={selectedPlatformId === platform.platform_id}
                    onSelect={() => setSelectedPlatformId(platform.platform_id)}
                  />
                ))}
              </div>

              <CustomPlatformCard
                active={selectedPlatformId === "custom"}
                onSelect={() => setSelectedPlatformId("custom")}
              />

              {selectedPlatformId === "custom" ? (
                <div className={styles.inlineFieldCard}>
                  <div className={styles.inlineFieldHeader}>
                    <div className={styles.inlineFieldTitle}>직접 수수료 입력</div>
                    <div className={styles.inlineFieldDescription}>
                      운영 중인 중개 수수료를 넣으면 결제 수수료는 아래 옵션에 맞춰 계산합니다.
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
              description="월 매출 구간을 고르면 해당 수수료가 바로 반영됩니다."
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
                      <div className={styles.tierHead}>
                        <div className={styles.tierTitle}>{getTierTitle(tier)}</div>
                        {badge ? <span className={styles.tierBadge}>{badge}</span> : null}
                      </div>
                      <div className={styles.tierMetaRow}>
                        {getTierMetaItems(tier).map((item) => (
                          <span
                            key={item}
                            className={`${styles.tierMetaChip} ${
                              item.includes("부가세") ? styles.tierMetaVat : ""
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
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
            title="판매 정보 입력"
            description="메뉴 가격과 비용, 옵션 두 가지만 확인하면 실마진이 바로 계산됩니다."
          />

          <div className={styles.fieldStack}>
            <NumberField
              primary
              label="메뉴 판매가"
              hint="고객 결제 금액"
              value={menuPrice}
              onChange={handleNumericChange(setMenuPrice)}
              placeholder="예: 18,000"
              help="판매가를 넣는 즉시 아래 결과가 바뀝니다."
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

          <div className={styles.inlineOptionsBlock}>
            <div className={styles.inlineOptionsHeader}>
              <div className={styles.inlineOptionsTitle}>옵션 반영</div>
              <div className={styles.inlineOptionsDescription}>
                카드 수수료와 부가세 포함 여부를 선택하세요.
              </div>
            </div>

            <div className={styles.settingGrid}>
              <ToggleRow
                label="카드 수수료 포함"
                description="끄면 결제 수수료를 제외합니다."
                checked={cardFeeOn}
                onToggle={() => setCardFeeOn((value) => !value)}
              />
              <ToggleRow
                label="부가세 포함"
                description="켜면 판매가의 10%를 반영합니다."
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
          </div>
        </section>

        <section className={`${styles.card} ${styles.resultCard}`}>
          <SectionHeader
            step={selectedPlatformId === "custom" ? "STEP 3" : "STEP 4"}
            title="예상 결과"
            description="메뉴 1개 팔면 얼마 남는지 먼저 보여드리고, 필요한 비교만 아래에 담았습니다."
          />

          {!calc ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>₩</div>
              <div className={styles.emptyTitle}>판매가를 입력하면 예상 마진이 바로 표시됩니다.</div>
              <div className={styles.emptyDescription}>
                앱과 옵션은 이미 반영되어 있으니 숫자만 넣어보세요.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.resultHeroPanel}>
                <div className={styles.resultHeroHeader}>
                  <div>
                    <div className={styles.resultContextLabel}>현재 조건</div>
                    <div className={styles.resultEyebrow}>
                      {selectedPlatformName}
                      <span className={styles.resultEyebrowDivider}>·</span>
                      {selectedTierName}
                    </div>
                  </div>

                  <div className={`${styles.rateBadge} ${resultTone?.badgeClass || ""}`}>
                    <span className={styles.rateBadgeIcon}>{resultTone?.icon}</span>
                    <span className={styles.rateBadgeCopy}>
                      <span>{resultTone?.label}</span>
                      <strong>{formatPercent(calc.marginRate)}</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.resultLead}>메뉴 1개 팔면</div>
                <div
                  className={`${styles.resultValue} ${
                    calc.margin >= 0 ? styles.resultValuePositive : styles.resultValueNegative
                  }`}
                >
                  {formatCurrency(calc.margin)}
                </div>

                <div className={styles.resultHeroMeta}>
                  <div className={styles.resultMiniMetric}>
                    <span className={styles.resultMiniLabel}>
                      {calc.margin >= 0 ? "매출 1만원당 남는 돈" : "매출 1만원당 손실"}
                    </span>
                    <strong>{formatCurrency(calc.contributionPerTenThousand)}</strong>
                  </div>
                  <div className={styles.resultMiniMetric}>
                    <span className={styles.resultMiniLabel}>총 차감액</span>
                    <strong>{formatCurrency(calc.totalDeductions)}</strong>
                  </div>
                </div>

                <div className={`${styles.resultInsight} ${resultTone?.insightClass || ""}`}>
                  <strong>{resultTone?.headline}</strong>
                  <span>{resultTone?.action}</span>
                </div>
              </div>

              <div className={styles.factGrid}>
                {resultFacts.map((item) => (
                  <div key={item.label} className={`${styles.factCard} ${item.className}`}>
                    <span className={styles.factLabel}>{item.label}</span>
                    <strong className={styles.factValue}>{item.value}</strong>
                    <span className={styles.factNote}>{item.note}</span>
                  </div>
                ))}
              </div>

              <div className={styles.breakdownPanel}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>수익 구조</div>
                  <div className={styles.panelCaption}>한 주문 기준 차감 구성을 한눈에 봅니다.</div>
                </div>
                <div className={styles.meter}>
                  {meterSegments.map((segment) => (
                    <span
                      key={segment.key}
                      className={styles.meterSegment}
                      style={{ width: segment.width, backgroundColor: segment.color }}
                    />
                  ))}
                </div>
                <div className={styles.breakdownList}>
                  {breakdownItems.map((item) => (
                    <div key={item.label} className={`${styles.breakdownRow} ${item.className}`}>
                      <div className={styles.breakdownLabelWrap}>
                        <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                        <span className={styles.breakdownLabel}>{item.label}</span>
                        <span className={styles.breakdownShare}>{item.share}</span>
                      </div>
                      <div className={styles.breakdownValues}>
                        <strong>{formatCurrency(item.value)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {comparison.length > 1 ? (
                <div className={styles.comparePanel}>
                  <div className={styles.comparePanelHeader}>
                    <div>
                      <div className={styles.compareTitle}>앱별 비교</div>
                      <div className={styles.compareDescription}>{compareHeadline}</div>
                    </div>
                    {bestComparison ? (
                      <span className={styles.compareSummaryPill}>최고 {bestComparison.name}</span>
                    ) : null}
                  </div>

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
                            index === 0
                              ? styles.compareRowBest
                              : active
                                ? styles.compareRowCurrent
                                : styles.compareRowDefault
                          }`}
                        >
                          <div className={styles.compareRank}>{index + 1}</div>

                          <div className={styles.compareCopy}>
                            <div className={styles.compareNameRow}>
                              <div className={styles.compareName}>{item.name}</div>
                              <div className={styles.compareStatusRow}>
                                {index === 0 ? (
                                  <span className={styles.compareBest}>가장 유리</span>
                                ) : null}
                                {active ? (
                                  <span className={styles.compareCurrent}>현재 선택</span>
                                ) : null}
                              </div>
                            </div>

                            <div className={styles.compareMeta}>
                              총 수수료 {formatPercent(item.totalRate)}
                            </div>

                            {!active && currentComparison ? (
                              <span
                                className={`${styles.compareDeltaPill} ${
                                  delta > 0
                                    ? styles.compareDeltaPositive
                                    : delta < 0
                                      ? styles.compareDeltaNegative
                                      : styles.compareDeltaNeutral
                                }`}
                              >
                                현재 대비 {formatSignedCurrency(delta)}
                              </span>
                            ) : null}
                          </div>

                          <div className={styles.compareValues}>
                            <strong
                              className={`${styles.compareAmount} ${
                                item.margin >= 0 ? styles.compareAmountPositive : styles.compareAmountNegative
                              }`}
                            >
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
            <div className={styles.detailsTitle}>추가분석</div>
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
            <div className={styles.subsectionTitle}>주문 수 시뮬레이션</div>
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
                일 주문 수를 넣으면 기간별 예상 마진이 바로 계산됩니다.
              </div>
            )}

            {breakEvenOrders ? (
              <div className={styles.breakEvenBox}>
                <span className={styles.breakEvenLead}>
                  월 고정비 {formatCurrency(parseNumber(fixedCost))}를 회수하려면
                </span>
                <strong className={styles.breakEvenValue}>
                  현재 조건에서 약 {numberFormatter.format(breakEvenOrders)}건 주문이 필요합니다.
                </strong>
              </div>
            ) : null}

            <div className={styles.subsectionTitle}>AI 해석</div>
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
              {analysisLoading ? "AI 분석 불러오는 중..." : "AI로 운영 코멘트 보기"}
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
                  AI 해석은 참고용입니다. 실제 정산은 광고비, 쿠폰, 프로모션 정책에 따라 달라질 수 있습니다.
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
            결과 공유
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
