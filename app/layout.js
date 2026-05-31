import "./globals.css";

export const metadata = {
  title: "Operator's Log",
  description: "실전 사업 운영 아카이브"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <a className="brand" href="/">
              <span className="brand-kicker">Operator's Log</span>
              <strong>실전 사업 운영 아카이브</strong>
            </a>
            <p className="site-intro">
              실제 운영에서 벌어진 일과 판단 과정을 인터뷰 기반 글로
              기록합니다.
            </p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
