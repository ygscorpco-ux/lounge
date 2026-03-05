'use client';

/**
 * ToolHeader — 사장님 도구 공통 상단 헤더
 * props:
 *   icon    : SVG 요소 (ReactNode)
 *   title   : 타이틀 문자열
 *   sub     : 부제목 문자열
 *   badge   : 오른쪽 보조 뱃지 문자열 (선택)
 *   gradient: 배경 그라디언트 CSS 문자열 (기본: primary → accent)
 */
export default function ToolHeader({ icon, title, sub, note, badge, gradient }) {
  const bg = gradient || 'linear-gradient(135deg, #1b4797 0%, #2d5fc4 100%)';

  return (
    <div style={{
      background: bg,
      padding: '22px 20px 26px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 장식 원 배경 */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '140px', height: '140px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-40px', left: '60px',
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          {/* 아이콘 컨테이너 */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {icon}
          </div>
          {/* 텍스트 영역 — minWidth:0 이 없으면 flex 자식이 넘침 */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '4px' }}>
              {title}
            </div>
            {sub && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                {sub}
              </div>
            )}
            {note && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginTop: '3px' }}>
                {note}
              </div>
            )}
          </div>
        </div>
        {badge && (
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#fff',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '8px', padding: '5px 10px',
            flexShrink: 0, marginLeft: '8px', lineHeight: 1.5,
            textAlign: 'center', whiteSpace: 'pre',
          }}>
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
