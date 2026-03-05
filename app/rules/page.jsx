'use client';
import { useRouter } from 'next/navigation';

export default function RulesPage() {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '480px', height: '100vh',
      display: 'flex', flexDirection: 'column', background: '#fff', zIndex: 200,
    }}>

      {/* 상단 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
        background: '#fff', flexShrink: 0,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', padding: '4px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
            stroke="#333" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#333' }}>라운지 이용규칙</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* 본문 스크롤 영역 */}
      <div style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain', padding: '24px 20px 48px',
      }}>

        {/* 대제목 */}
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', marginBottom: '6px' }}>
          라운지 이용규칙
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: '24px' }}>
          최종 수정일: 2025년 1월 1일
        </p>

        <Section>
          <p>
            라운지의 이용규칙은 자영업자 및 소상공인이 서로 존중하며 익명으로 참여할 수 있는 공간을 만들기 위해 제정되었습니다.
            운영 주체인 염광사는 라운지 내 모든 기능을 본 이용규칙에 따라 운영하며,
            이용자는 라운지 이용 전 반드시 모든 내용을 숙지하여야 합니다.
          </p>
          <p>
            방송통신심의위원회의 심의규정, 현행 법률, 서비스 이용약관 및 이용규칙을 위반하거나,
            사회 통념 및 관련 법령을 기준으로 타 이용자에게 악영향을 끼치는 경우,
            게시물이 삭제되고 서비스 이용이 일정 기간 제한될 수 있습니다.
          </p>
          <p>
            이용규칙은 불법 행위, 차별·혐오, 갈등 조장, 권리 침해, 불쾌감을 주는 행위, 유출 행위 등
            라운지 운영에 악영향을 미치는 행위들을 제한하기 위해 지속적으로 개정됩니다.
            중대한 변경 시 공지사항을 통해 고지하오니 반드시 확인해주시기 바랍니다.
          </p>
        </Section>

        <SectionTitle>라운지 운영 시스템</SectionTitle>
        <Section>
          <p>
            운영 시스템은 이용규칙 위반을 빠르게 감지하고 조치하기 위해 도입되었습니다.
            현행 법률에 따른 청소년유해매체물, 권리 침해, 비정상적인 이용 등의 규칙 위반 행위에
            AI 기반으로 선제적으로 대응하고 있습니다.
          </p>
          <p>
            이용규칙 위반이 확인될 경우, 게시물이 삭제되고 서비스 이용이 일정 기간 제한됩니다.
            위반 횟수가 누적될수록 이용 제한 기간이 증가할 수 있습니다.
          </p>
          <WarningBox>
            생명 경시 행위, 고인 모독, 성적 도의관념 위반, 비정상적 이용 등 중대한 위반 시
            즉시 <strong>1년 이상</strong> 이용이 제한됩니다.
            <br /><br />
            음란물, 범죄·불법 행위, 계정 판매, 홍보·판매 등 심각한 위반 시
            <strong>5년 이상 제한 또는 영구 이용계약 해지</strong>될 수 있습니다.
          </WarningBox>
          <p>
            이용 제한 시 관련 내용이 알림을 통해 개별 통지되며, 제한 기간·근거 게시물 등은
            내 정보에서 확인하실 수 있습니다.
          </p>
        </Section>

        <SectionTitle>유출 방지 시스템</SectionTitle>
        <Section>
          <p>
            라운지의 게시물, 댓글, 매출·운영 관련 자료를 복사·스크린샷·촬영하여
            외부 사이트·대화방에 게시하거나, 타인에게 공유하거나, 크롤링하는 등
            유출 행위가 적발될 경우 <strong>5년 이상 이용 제한 또는 영구 해지</strong>될 수 있습니다.
          </p>
          <p>
            모든 이용자는 외부 유출로 인한 피해에 대해 민형사상 책임을 집니다.
          </p>
        </Section>

        <SectionTitle>금지 행위</SectionTitle>

        <SubTitle>일반 금지 행위</SubTitle>
        <Section>
          <BulletList items={[
            '국제 평화·국제 질서를 해할 우려가 있는 행위 (인종차별, 테러 등)',
            '헌법에 위배되거나 국가 존립을 해하는 행위',
            '범죄 목적·범죄 조장·범죄 미화 행위',
            '성적 도의관념에 반하는 음란·선정적 표현',
            '폭력성·잔혹성·혐오성이 심각한 묘사',
            '도박·사행심 조장, 불법 거래 행위',
            '고인 모독, 자살·자해 조장 행위',
            '합리적 이유 없이 성별·종교·장애·지역·인종 등을 차별하는 행위',
            '타인의 권리를 침해하는 행위 (개인정보 유포, 명예훼손, 저작권 침해 등)',
          ]} />
        </Section>

        <SubTitle>정치·사회 관련 금지 행위</SubTitle>
        <Section>
          <BulletList items={[
            '언론·시민단체 등 옹호·추천·반대·비하 행위',
            '특정 정당·후보에 대한 지지, 비방, 투표 독려',
            '다른 이용자를 특정 정치·이념 관련자로 몰아가는 행위',
            '정책·외교·정치·정파에 대한 의견·주장·이념 표현',
            '성별·종교·인종·지역 등 사회적 갈등을 조장하는 행위',
          ]} />
        </Section>

        <SubTitle>홍보·판매 관련 금지 행위</SubTitle>
        <Section>
          <BulletList items={[
            '광고·바이럴·유사 서비스 홍보',
            '신용카드, 보험, 의료, 성인·도박·베팅 사이트 광고',
            '외부 단체·모임·커뮤니티 홍보',
            '중고거래·재판매·공동구매·펀딩',
            '구독·좋아요·팔로우·링크 클릭·앱 설치 요청',
            '영리 여부와 관계없이 직간접적으로 홍보 효과가 있는 게시물',
          ]} />
        </Section>

        <SubTitle>악용·오용 행위</SubTitle>
        <Section>
          <BulletList items={[
            '익명을 이용한 여론 조작',
            '신고·공감 유도 및 악용',
            '동일·유사 내용의 게시물 반복 게시',
            '허위·거짓 정보를 포함한 게시물 작성',
            '라운지 운영 목적에 부합하지 않는 게시물',
            '회사 또는 이에 준하는 자격 사칭',
            '시스템 해킹·크롤링 등 서비스에 악영향을 주는 행위',
          ]} />
        </Section>

        <SectionTitle>게시물 작성·수정·삭제 규칙</SectionTitle>
        <Section>
          <RuleItem label="중복 게시">
            동일·유사 내용의 게시물을 작성한 경우, 3일간 동일·유사한 내용의 글을 다시 작성할 수 없습니다.
          </RuleItem>
          <RuleItem label="작성 횟수">
            자유게시판은 5분에 최대 3번만 작성할 수 있습니다.
          </RuleItem>
          <RuleItem label="수정·삭제 제한">
            게시물 작성 후 60분이 지나면, 3일간 수정하거나 삭제할 수 없습니다.
          </RuleItem>
          <RuleItem label="HOT 게시물">
            공감 10개를 받으면 자동 선정됩니다.
          </RuleItem>
          <RuleItem label="BEST 게시물">
            공감 100개를 받으면 자동 선정됩니다.
          </RuleItem>
        </Section>

        <SectionTitle>불법촬영물 유통 금지</SectionTitle>
        <Section>
          <p>
            전기통신사업법에 따라 불법촬영물 등 유해정보로 식별되는 자료는 즉시 삭제 또는 블라인드 처리되며,
            작성자는 최대 7일간 이용이 제한될 수 있습니다.
          </p>
          <p>
            실제 불법촬영물을 게재할 경우 영구 이용계약 해지 및 관련 법률에 따라 처벌받을 수 있습니다.
          </p>
        </Section>

        <SectionTitle>기타</SectionTitle>
        <Section>
          <p>
            이용규칙은 쾌적한 서비스 운영을 위해 주기적으로 업데이트됩니다.
            이용자가 이용규칙을 숙지하지 않아 발생하는 피해에 대해 염광사는
            고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
          </p>
          <p style={{ color: '#999', fontSize: '13px' }}>
            이 이용규칙은 별도 공지한 날부터 시행됩니다.
          </p>
        </Section>

      </div>
    </div>
  );
}

/* ── 재사용 컴포넌트들 ── */

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontSize: '17px', fontWeight: 800, color: '#1a1a1a',
    marginTop: '32px', marginBottom: '12px',
    paddingBottom: '8px', borderBottom: '2px solid #1b4797',
  }}>
    {children}
  </h2>
);

const SubTitle = ({ children }) => (
  <h3 style={{
    fontSize: '14px', fontWeight: 700, color: '#1b4797',
    marginTop: '20px', marginBottom: '8px',
  }}>
    {children}
  </h3>
);

const Section = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {children}
  </div>
);

const WarningBox = ({ children }) => (
  <div style={{
    background: '#fff8f0', border: '1px solid #ffddbb',
    borderRadius: '10px', padding: '14px 16px',
    fontSize: '13px', color: '#c0621a', lineHeight: 1.7,
  }}>
    {children}
  </div>
);

const BulletList = ({ items }) => (
  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: '#444', lineHeight: 1.6 }}>
        <span style={{ color: '#1b4797', flexShrink: 0, fontWeight: 700 }}>·</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const RuleItem = ({ label, children }) => (
  <div style={{ borderLeft: '3px solid #e8edf5', paddingLeft: '12px' }}>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1b4797', marginBottom: '3px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>{children}</div>
  </div>
);
