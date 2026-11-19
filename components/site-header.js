"use client";

import { usePathname } from "next/navigation";

export default function SiteHeader({ personalSlugs }) {
  const pathname = usePathname();
  const personal = pathname === "/personal" || personalSlugs.some((slug) => pathname === `/blog/${slug}`);

  return (
    <header className="site-header newsroom-header">
      <div>
        <p className="eyebrow">{personal ? "Personal travel & everyday notes" : "Interview-based operating archive"}</p>
        <h1 className="site-title">{personal ? "여행·생활 기록" : "실전 사업 운영 인터뷰 모음"}</h1>
      </div>
      <p className="site-intro">
        {personal
          ? "여행과 일상에서 직접 겪고 확인한 일을 남깁니다. 사업 운영 아카이브와 별도로 모아 두는 개인 경험과 실용적인 기록입니다."
          : "실제 사업을 운영하면서 겪은 공매, 민원, 사고, 세무, 계약, 시설 문제와 그때의 판단을 기록합니다. AI가 질문하고 운영자가 답한 실제 경험을 바탕으로, 잘 포장된 성공담보다 현장에서 무엇을 판단했고 무엇을 놓쳤는지를 남깁니다."}
      </p>
    </header>
  );
}
