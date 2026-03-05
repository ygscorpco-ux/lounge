// ─── 최저시급 연도별 테이블 ─────────────────────────────────────────────────
// 매년 초 여기에 한 줄만 추가하면 전체 코드에 자동 반영됩니다
export const MIN_WAGE_BY_YEAR = {
  2024: 9860,
  2025: 10030,
  2026: 10320,
};

// 현재 연도에 맞는 최저시급을 자동으로 반환 (연도 데이터 없으면 최신값 사용)
export const getCurrentMinWage = () => {
  const year = new Date().getFullYear();
  // 현재 연도 → 그 전 연도 순서로 찾아서 반환
  return MIN_WAGE_BY_YEAR[year]
    ?? MIN_WAGE_BY_YEAR[year - 1]
    ?? 10320;
};

// ─── 4대보험 요율 (연도별) ──────────────────────────────────────────────────
// 국민연금은 2026~2033년까지 매년 0.5%p씩 인상 예정 → 미리 채워둠
export const INSURANCE_RATES_BY_YEAR = {
  2025: {
    nationalPensionEmployee: 0.045,   // 국민연금 근로자
    nationalPensionEmployer: 0.045,   // 국민연금 사업주
    healthEmployee:          0.03545, // 건강보험 근로자
    healthEmployer:          0.03545, // 건강보험 사업주
    employmentEmployee:      0.009,   // 고용보험 근로자
    employmentEmployer:      0.0115,  // 고용보험 사업주
    industrialAccident:      0.007,   // 산재보험 (사업주만, 업종 평균)
  },
  2026: {
    nationalPensionEmployee: 0.0475,
    nationalPensionEmployer: 0.0475,
    healthEmployee:          0.03595,
    healthEmployer:          0.03595,
    employmentEmployee:      0.009,
    employmentEmployer:      0.0115,
    industrialAccident:      0.007,
  },
  2027: {
    nationalPensionEmployee: 0.05,    // 2027년 예정 (+0.25%p)
    nationalPensionEmployer: 0.05,
    healthEmployee:          0.03595, // 미확정 — 확정 시 업데이트
    healthEmployer:          0.03595,
    employmentEmployee:      0.009,
    employmentEmployer:      0.0115,
    industrialAccident:      0.007,
  },
};

// 현재 연도 보험 요율 반환
export const getCurrentInsuranceRates = () => {
  const year = new Date().getFullYear();
  return INSURANCE_RATES_BY_YEAR[year]
    ?? INSURANCE_RATES_BY_YEAR[year - 1]
    ?? INSURANCE_RATES_BY_YEAR[2026];
};

// ─── 말머리 카테고리 목록 ────────────────────────────────────────────────────
// 말머리 카테고리 목록
export const CATEGORIES = [
  '매출고민',
  '직원관리',
  '운영노하우',
  '멘탈관리',
  '마케팅질문',
  '염광사'
];

// 신고 몇 건이면 자동 숨김 처리할지
export const REPORT_THRESHOLD = 5;

// 글 목록 한 번에 불러올 개수
export const PAGE_SIZE = 20;

// 관리자 역할명
export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
