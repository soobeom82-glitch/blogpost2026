const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export const metadata = {
  title: "문의 | Operator's Log",
  description: "Operator's Log 문의, 정정 요청, 제휴 문의 안내 페이지"
};

export default function ContactPage() {
  return (
    <article className="info-page">
      <div className="info-page-head">
        <p className="eyebrow">Contact</p>
        <h1>문의</h1>
        <p className="info-page-summary">
          콘텐츠 오류 제보, 사실관계 정정 요청, 댓글 관련 문의, 협업·광고 문의는
          아래 방법으로 전달할 수 있습니다.
        </p>
      </div>

      <div className="info-page-body">
        <section>
          <h2>연락 방법</h2>
          {contactEmail ? (
            <p>
              이메일:{" "}
              <a className="inline-link" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </p>
          ) : (
            <p>
              운영자 이메일은 아직 공개되지 않았습니다. 실제 운영용 이메일을
              정한 뒤 이 페이지에서 바로 갱신할 수 있도록 구조를 준비해두었습니다.
            </p>
          )}
        </section>

        <section>
          <h2>어떤 문의를 받나요?</h2>
          <ul className="info-list">
            <li>콘텐츠 내 사실관계 오류 제보</li>
            <li>개인정보, 댓글, 삭제 관련 요청</li>
            <li>광고·협업·인터뷰 제안</li>
            <li>사이트 기능 이상 또는 링크 오류 제보</li>
          </ul>
        </section>

        <section>
          <h2>안내</h2>
          <ul className="info-list">
            <li>콘텐츠 내 사실관계 오류 제보는 확인 후 반영합니다.</li>
            <li>광고·제휴 문의는 사전 검토 후 응답할 수 있습니다.</li>
            <li>댓글 관련 신고나 삭제 요청도 같은 경로로 받습니다.</li>
            <li>회신이 필요한 문의는 연락 가능한 정보를 함께 남겨야 처리할 수 있습니다.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
