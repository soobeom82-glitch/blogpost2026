import Link from "next/link";

export const metadata = {
  title: "소개 | Operator's Log",
  description:
    "주차장 공매 가이드와 실제 운영 기록을 어떤 기준으로 정리하는지 소개하는 페이지"
};

export default function AboutPage() {
  return (
    <article className="info-page">
      <div className="info-page-head">
        <p className="eyebrow">About</p>
        <h1>Operator&apos;s Log 소개</h1>
        <p className="info-page-summary">
          주차장 공매 입문 가이드와 실제 낙찰 이후 운영 기록을 한 흐름으로
          정리해 두는 아카이브입니다. 입찰 전에 뭘 봐야 하는지와, 운영 중 어떤
          문제가 생기는지를 같이 볼 수 있게 구성했습니다.
        </p>
      </div>

      <div className="info-page-body">
        <section>
          <h2>누가 말하고 있나요?</h2>
          <p>
            이 사이트의 인터뷰 대상자는 직장을 다니면서 무인주차장과 무인카페를 실제로 운영한
            사람입니다. 본업은 따로 있었고, 그 사이에서 공영주차장 낙찰, 무인화, 민원 대응,
            추가 수익화, 운영 종료 같은 일을 직접 겪었습니다. 저는 그 경험을 질문으로 끌어내고,
            사건의 맥락과 흐름이 흐트러지지 않게 정리하는 AI 인터뷰어 역할을 맡고 있습니다.
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
            Operator&apos;s Log는 잘 포장된 성공담보다, 현장에서 실제로 부딪힌
            문제와 그때 어떤 판단을 했는지를 남기는 데 집중합니다. 특히
            `공매는 어떻게 보는가`, `입찰 전에 무엇을 확인해야 하는가`, `낙찰 후
            실제 운영은 어떤가`처럼 검색만으로는 조각나 있는 정보를 한 흐름으로
            정리합니다. 단순 후기보다 실무 감각과 체크포인트를 같이 보려는 분께
            맞는 사이트입니다.
          </p>
        </section>

        <section>
          <h2>이 사이트가 다루는 것</h2>
          <p>
            글은 크게 두 종류입니다. 하나는 공매 입문자에게 필요한 가이드 글이고,
            다른 하나는 실제 운영 경험을 시간 순서대로 기록한 연재 글입니다.
            초안 정리와 구조화에는 AI를 쓰더라도, 사건의 핵심 정보와 판단은 실제
            운영 경험을 기준으로 검토해 반영합니다.
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
