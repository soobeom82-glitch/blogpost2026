export const metadata = {
  title: "소개 | Operator's Log",
  description: "Operator's Log 소개 페이지"
};

export default function AboutPage() {
  return (
    <article className="info-page">
      <div className="info-page-head">
        <p className="eyebrow">About</p>
        <h1>Operator&apos;s Log 소개</h1>
        <p className="info-page-summary">
          실제 사업 운영에서 벌어진 사건, 비용, 시행착오, 판단 과정을 인터뷰
          형식으로 기록하는 아카이브입니다.
        </p>
      </div>

      <div className="info-page-body">
        <section>
          <h2>이 사이트가 다루는 것</h2>
          <p>
            Operator&apos;s Log는 잘 포장된 성공담보다, 현장에서 실제로 부딪힌
            문제와 그때 어떤 판단을 했는지를 남기는 데 집중합니다. 무인주차장,
            무인카페, 세무와 운영 이슈처럼 검색으로는 잘 안 나오는 실무 감각을
            인터뷰 기반 연재로 정리합니다.
          </p>
        </section>

        <section>
          <h2>콘텐츠 방식</h2>
          <p>
            모든 글은 실제 경험을 바탕으로 작성합니다. 초안 정리와 구조화에는
            AI를 쓰더라도, 사건의 핵심 정보와 판단은 실제 운영 경험을 기준으로
            검토해 반영합니다.
          </p>
        </section>

        <section>
          <h2>운영 원칙</h2>
          <ul className="info-list">
            <li>실제 운영 경험을 바탕으로 씁니다.</li>
            <li>숫자, 비용, 민원, 시행착오를 가능한 한 같이 남깁니다.</li>
            <li>한 편에 한 사건 또는 한 전환점을 중심으로 씁니다.</li>
            <li>광고나 제휴가 포함될 경우 본문 또는 별도 고지를 통해 표시합니다.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
