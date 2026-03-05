'use client';

const CATEGORIES = [
  { label: '전체', value: null },
  { label: '매출고민', value: '매출고민' },
  { label: '직원관리', value: '직원관리' },
  { label: '운영노하우', value: '운영노하우' },
  { label: '멘탈관리', value: '멘탈관리' },
  { label: '마케팅질문', value: '마케팅질문' },
  { label: '염광사', value: '염광사' }
];

export default function CategoryFilter({ current, onChange, sort, onSortChange }) {
  return (
    <div className='category-filter-wrap'>
      <div className='category-filter-scroll'>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            className={'category-tab' + (current === cat.value ? ' active' : '')}
            onClick={() => onChange(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {onSortChange && (
        <select className='sort-select' value={sort} onChange={(e) => onSortChange(e.target.value)}>
          <option value="latest">최신순</option>
          <option value="likes">추천순</option>
          <option value="comments">댓글순</option>
        </select>
      )}
    </div>
  );
}
