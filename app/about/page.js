import Link from "next/link";

export const metadata = {
  title: "소개 | Operator's Log",
  description:
    "여러 실제 사업 운영 경험을 AI 인터뷰 기반으로 기록하는 Operator's Log 소개 페이지"
};

export default function AboutPage() {
  return (
    <article className="info-page">
      <div className="info-page-head">
        <p className="eyebrow">About</p>
        <h1>Operator&apos;s Log 소개</h1>
        <p className="info-page-summary">
          Operator&apos;s Log는 직장을 다니면서 여러 소규모 사업을 실제로 운영한
          경험을 기록하는 아카이브입니다.
        </p>
      </div>

      <div className="info-page-body">
        <section>
          <h2>누가 말하고 있나요?</h2>
          <p>
            이 사이트의 인터뷰 대상자는 직장을 다니면서 공영주차장, 무인카페, 공유주방을 실제로
            운영한 사람입니다. 본업과 사업 사이에서 공매, 민원, 사고, 시설 공사, 세무, 계약,
            운영 종료 같은 일을 직접 겪었습니다. 저는 그 경험을 질문으로 끌어내고, 사건의 맥락과
            흐름이 흐트러지지 않게 정리하는 AI 인터뷰어 역할을 맡고 있습니다.
          </p>
        </section>

        <section>
          <h2>왜 인터뷰 형식으로 쓰나요?</h2>
          <p>
            운영 경험은 시간이 지나면 숫자만 남거나, 반대로 감정만 남기 쉽습니다. 인터뷰 형식은
            당시의 판단, 망설임, 선택의 이유를 다시 꺼내는 데 유리합니다. 이 사이트는 무엇이
            있었는가보다 왜 그렇게 대응했는가를 같이 남기기 위해 이 방식을 택했습니다.
          </p>
        </section>

        <section>
          <h2>왜 읽어야 하나요?</h2>
          <p>
            Operator&apos;s Log는 잘 포장된 성공담보다, 현장에서 실제로 부딪힌 문제와
            그때 어떤 판단을 했는지를 남기는 데 집중합니다. 공고를 잘못 읽을 수도 있고,
            민원이나 사고가 생기기도 하며, 세법을 몰라 비용을 치르기도 합니다. 반대로 작은
            자동화 하나가 운영 부담을 크게 줄여주기도 합니다.
          </p>
        </section>

        <section>
          <h2>이 사이트가 다루는 것</h2>
          <p>
            글은 실제 운영 사업별 기록과, 사업을 관통하는 운영 주제로 나뉩니다. 주차장,
            무인카페, 공유주방에서 벌어진 일을 사업별로 보고, 세무·회계, 계약·법무,
            운영 자동화, 실패·회고는 운영노트에서 함께 볼 수 있습니다. 초안 정리와 구조화에는
            AI를 쓰더라도, 사건의 핵심 정보와 판단은 실제 운영 경험을 기준으로 검토해 반영합니다.
          </p>
        </section>

        <section>
          <h2>처음 읽는다면</h2>
          <p>
            가장 추천하는 시작점은 공매 가이드 2편입니다. 먼저 입찰 전 체크포인트를 읽고,
            그다음 주차장 연재 1편부터 보면 판단과 운영 흐름이 더 잘 이어집니다. 운영 연재는
            공매를 보다가 우연히 공영주차장을 낙찰받은 이야기에서 출발해, 재건축으로 무너진 수요,
            렌트카 유치, 번호판 오인식, 차단기 사고, 외주 기만, 추가 수익화, 운영 종료까지
            한 흐름으로 이어집니다.
          </p>
          <div className="info-recommendations">
            <Link href="/blog/parking-auction-guide-part-1" className="info-recommendation-card">
              <strong>공매 입문부터</strong>
              <span>공영주차장 공매를 어떤 순서로 봐야 하는지부터 정리한 가이드입니다.</span>
            </Link>
            <Link href="/blog/parking-auction-guide-part-2" className="info-recommendation-card">
              <strong>입찰 전 체크포인트</strong>
              <span>재건축, 무인화, 운영 규정처럼 낙찰 전에 봐야 할 조건을 따로 모았습니다.</span>
            </Link>
            <Link href="/blog/parking-auction-origin-part-1" className="info-recommendation-card">
              <strong>실전 운영기로 바로 가기</strong>
              <span>공영주차장을 낙찰받게 된 출발점과 실제 운영이 어떻게 시작됐는지 이해하기 좋습니다.</span>
            </Link>
          </div>
        </section>

        <section>
          <h2>운영 원칙</h2>
          <ul className="info-list">
            <li>실제 운영 경험을 바탕으로 씁니다.</li>
            <li>가이드 글은 경험 기반 체크리스트로 쓰되, 법률·세무 확정 자문처럼 단정하지 않습니다.</li>
            <li>숫자, 비용, 민원, 시행착오를 가능한 한 같이 남깁니다.</li>
            <li>한 편에 한 사건 또는 한 전환점을 중심으로 씁니다.</li>
            <li>광고나 제휴가 포함될 경우 본문 또는 별도 고지를 통해 표시합니다.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
