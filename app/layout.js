import "./globals.css";
import AdSenseScript from "../components/adsense-script";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://blogpost2026.vercel.app");
const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;
const adsenseClient =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || undefined;

export const metadata = {
  title: "Operator's Log",
  description:
    "공영주차장 공매, 주차장 낙찰, 무인주차장 운영, 추가 수익 만들기, 민원과 사고 대응까지 직장인이 실제로 겪은 과정을 AI 인터뷰 형식으로 기록한 실전 사업 운영 아카이브",
  keywords: [
    "주차장 공매",
    "공영주차장 낙찰",
    "주차장 사업",
    "무인주차장 운영",
    "주차장 민원 대응",
    "주차장 수익화",
    "실전 사업 운영",
    "무인카페 운영"
  ],
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
  other: adsenseClient
    ? {
        "google-adsense-account": adsenseClient
      }
    : undefined,
  openGraph: {
    title: "Operator's Log",
    description:
      "공영주차장 공매, 주차장 낙찰, 무인주차장 운영, 추가 수익 만들기, 민원과 사고 대응까지 직장인이 실제로 겪은 과정을 AI 인터뷰 형식으로 기록한 실전 사업 운영 아카이브",
    url: siteUrl,
    siteName: "Operator's Log",
    images: ["/images/site-representative.jpg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator's Log",
    description:
      "공영주차장 공매, 주차장 낙찰, 무인주차장 운영, 추가 수익 만들기, 민원과 사고 대응까지 직장인이 실제로 겪은 과정을 AI 인터뷰 형식으로 기록한 실전 사업 운영 아카이브",
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
    description:
      "공영주차장 공매, 주차장 낙찰, 무인주차장 운영, 추가 수익 만들기, 민원과 사고 대응까지 직장인이 실제로 겪은 과정을 AI 인터뷰 형식으로 기록한 실전 사업 운영 아카이브",
    inLanguage: "ko-KR",
    keywords:
      "주차장 공매, 공영주차장 낙찰, 주차장 사업, 무인주차장 운영, 주차장 수익화, 주차장 민원 대응"
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
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="brand-mark-icon" role="presentation">
                  <path d="M12 3a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 1 0 7 0v-5A3.5 3.5 0 0 0 12 3Z" />
                  <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0" />
                  <path d="M12 16v4" />
                  <path d="M9.5 20h5" />
                </svg>
              </span>
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
              공영주차장 공매로 주차장을 낙찰받아 실제 운영하면서 겪은 민원,
              사고, 추가 수익화, 세무 판단과 무인카페 운영 경험을, AI가 질문하고
              운영자가 답하는 방식으로 기록합니다. 잘 포장된 성공담보다 실제
              현장에서 어떤 선택을 했는지 남기는 인터뷰 아카이브입니다.
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
