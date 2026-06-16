export const metadata = {
  title: "개인정보처리방침 | Operator's Log",
  description: "Operator's Log 개인정보 수집, 댓글 데이터, 광고 도구 관련 안내"
};

export default function PrivacyPage() {
  return (
    <article className="info-page">
      <div className="info-page-head">
        <p className="eyebrow">Privacy</p>
        <h1>개인정보처리방침</h1>
        <p className="info-page-summary">
          Operator&apos;s Log는 서비스 운영에 필요한 최소한의 정보만 다루는 것을
          원칙으로 하며, 댓글과 집계 데이터 처리 기준을 이 페이지에 공개합니다.
        </p>
      </div>

      <div className="info-page-body">
        <section>
          <h2>1. 수집하는 정보</h2>
          <p>
            현재 사이트는 댓글 기능을 통해 닉네임, 비밀번호, 댓글 본문을 저장할
            수 있습니다. 이 정보는 댓글 표시와 수정·삭제 확인을 위한 용도로만
            사용합니다.
          </p>
        </section>

        <section>
          <h2>2. 자동 수집 정보</h2>
          <p>
            사이트 운영 과정에서 조회수, 좋아요 수, 댓글 수와 같은 집계 데이터가
            저장될 수 있습니다. 광고 또는 분석 도구가 실제로 활성화될 경우 관련
            쿠키와 기술 정보가 추가로 사용될 수 있으며, 그 경우 본 방침을
            업데이트합니다.
          </p>
        </section>

        <section>
          <h2>3. 댓글 비밀번호와 저장 정보</h2>
          <p>
            댓글 작성 시 입력한 비밀번호는 수정·삭제 확인 용도로만 사용합니다.
            운영자는 댓글 관리와 정책 위반 대응을 위해 필요한 범위 내에서만 해당
            정보를 처리합니다.
          </p>
        </section>

        <section>
          <h2>4. 보관 및 이용 목적</h2>
          <ul className="info-list">
            <li>댓글 작성, 수정, 삭제 기능 제공</li>
            <li>사이트 운영 상태 확인 및 콘텐츠 반응 집계</li>
            <li>부정 이용, 스팸, 정책 위반 댓글 대응</li>
          </ul>
        </section>

        <section>
          <h2>5. 제3자 제공 및 외부 서비스</h2>
          <p>
            사이트는 호스팅과 데이터 저장을 위해 외부 인프라를 사용할 수
            있습니다. Google AdSense와 같은 광고 서비스가 활성화되면 관련 정책과
            고지를 이 페이지에 추가합니다.
          </p>
        </section>

        <section>
          <h2>6. 댓글 및 사용자 생성 콘텐츠</h2>
          <p>
            이용자가 남긴 댓글은 사이트에 공개될 수 있으며, 운영자는 스팸,
            명예훼손, 불법·유해 정보, 정책 위반 내용에 대해 수정 또는 삭제할 수
            있습니다.
          </p>
        </section>

        <section>
          <h2>7. 광고 및 쿠키 고지</h2>
          <p>
            사이트는 광고 심사 또는 광고 게재를 위해 외부 광고 도구를 사용할 수
            있습니다. 광고가 실제로 노출되는 경우 관련 쿠키, 식별자, 맞춤형 광고
            여부에 대한 고지를 본 방침 또는 별도 페이지에서 추가 안내합니다.
          </p>
        </section>

        <section>
          <h2>8. 문의</h2>
          <p>
            개인정보 또는 댓글 관련 문의는 문의 페이지를 통해 받을 수 있습니다.
          </p>
        </section>
      </div>
    </article>
  );
}
