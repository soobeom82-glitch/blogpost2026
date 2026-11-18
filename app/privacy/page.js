import { canonical } from "../../lib/site";
export const metadata = {
  alternates: canonical("/privacy"),
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
            조회수와 좋아요 중복 처리를 위해 무작위 익명 식별자가 든 쿠키를 최대 1년간 사용합니다.
            조회수는 브라우저·글·한국 날짜별로 집계하며 로그인 계정과 연결하지 않습니다.
            과도한 요청 제한에는 네트워크 주소에서 만든 해시 키를 사용하고,
            제한 시간이 지난 키는 이후 요청 처리 시 삭제합니다.
          </p>
        </section>

        <section>
          <h2>3. 댓글 비밀번호와 저장 정보</h2>
          <p>
            댓글 작성 시 입력한 비밀번호는 수정·삭제 확인 용도로만 사용합니다.
            새 비밀번호는 솔트가 포함된 scrypt 해시로 저장하며 원문을 저장하지 않습니다.
            기존 댓글은 수정 시 새 저장 방식으로 전환합니다.
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
            호스팅에는 Vercel, 데이터 저장에는 연결된 PostgreSQL 서비스를 사용합니다.
            Telegram 알림을 활성화하면 운영자 채널에 글 반응과 답글 닉네임·본문 일부를 전달합니다.
            Google AdSense가 연결된 경우 Google 광고 스크립트가 실행될 수 있습니다.
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
            Google 광고가 활성화되면 Google이 광고 제공과 측정에 쿠키 및 식별자를 사용할 수 있습니다.
            자세한 내용은 Google 개인정보처리방침과 광고 설정에서 확인할 수 있습니다.
          </p>
          <p><a href="https://policies.google.com/privacy">Google 개인정보처리방침</a> · <a href="https://myadcenter.google.com/">Google 광고 설정</a></p>
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
