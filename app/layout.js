import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

export const metadata = {
  title: "Operator's Log",
  description: "실전 사업 운영 아카이브",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Operator's Log",
    description: "실전 사업 운영 아카이브",
    images: ["/images/site-representative.jpg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator's Log",
    description: "실전 사업 운영 아카이브",
    images: ["/images/site-representative.jpg"]
  }
};

const categories = ["무인주차장", "무인카페", "채굴", "세무/사업"];

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="topbar">
          <div className="topbar-inner">
            <a className="brand brand-inverse" href="/">
              <strong>OPERATOR&apos;S LOG</strong>
            </a>

            <nav className="top-nav" aria-label="카테고리">
              {categories.map((category) => (
                <a key={category} className="top-nav-link" href="/">
                  {category}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="site-shell">
          <header className="site-header newsroom-header">
            <div>
              <p className="eyebrow">Interview-based operating archive</p>
              <h1 className="site-title">
                실전 사업 운영에서 나온 기록만 남깁니다.
              </h1>
            </div>

            <p className="site-intro">
              실제 운영에서 벌어진 일과 판단 과정을 인터뷰 기반 글로
              기록합니다. 잘 포장한 성공담보다, 실제 현장에서 부딪힌 변수와
              선택의 흐름을 남기는 뉴스룸 형태의 아카이브입니다.
            </p>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
