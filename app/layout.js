import "./globals.css";
import AdSenseScript from "../components/adsense-script";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://blogpost2026.vercel.app");
const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;

export const metadata = {
  title: "Operator's Log",
  description: "실전 사업 운영 인터뷰 모음",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`
    }
  },
  verification: {
    google: googleSiteVerification
  },
  openGraph: {
    title: "Operator's Log",
    description: "실전 사업 운영 인터뷰 모음",
    url: siteUrl,
    siteName: "Operator's Log",
    images: ["/images/site-representative.jpg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator's Log",
    description: "실전 사업 운영 인터뷰 모음",
    images: ["/images/site-representative.jpg"]
  }
};

const categories = [
  { label: "주차장", href: "/category/parking" },
  { label: "무인카페", href: "/category/cafe" }
];

export default function RootLayout({ children }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Operator's Log",
    url: siteUrl,
    description: "실전 사업 운영 인터뷰 모음",
    inLanguage: "ko-KR"
  };

  return (
    <html lang="ko">
      <body>
        <AdSenseScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema)
          }}
        />
        <div className="topbar">
          <div className="topbar-inner">
            <a className="brand brand-inverse" href="/">
              <strong>OPERATOR&apos;S LOG</strong>
            </a>

            <nav className="top-nav" aria-label="카테고리">
              {categories.map((category) => (
                <a key={category.label} className="top-nav-link" href={category.href}>
                  {category.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="site-shell">
          <header className="site-header newsroom-header">
            <div>
              <p className="eyebrow">Interview-based operating archive</p>
              <h1 className="site-title">실전 사업 운영 인터뷰 모음</h1>
            </div>

            <p className="site-intro">
              실제 운영에서 벌어진 일과 판단 과정을 인터뷰 기반 글로
              기록합니다. 잘 포장한 성공담보다, 실제 현장에서 부딪힌 변수와
              선택의 흐름을 남기는 뉴스룸 형태의 아카이브입니다.
            </p>
          </header>

          <main>{children}</main>

          <footer className="site-footer">
            <nav className="footer-nav" aria-label="사이트 정보">
              <a href="/category/parking">주차장</a>
              <a href="/category/cafe">무인카페</a>
              <a href="/about">소개</a>
              <a href="/contact">문의</a>
              <a href="/privacy">개인정보처리방침</a>
            </nav>

            <p className="footer-copy">
              Operator&apos;s Log는 실제 사업 운영 경험을 인터뷰 기반으로
              기록하는 아카이브입니다.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
