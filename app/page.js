import Link from "next/link";
import PostCard from "../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../lib/posts";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "주차장 공매, 낙찰, 운영 기록 | Operator's Log",
  description:
    "주차장 공매로 공영주차장을 낙찰받은 뒤 실제 운영하면서 생긴 민원, 사고, 추가 수익화, 세무 판단까지 AI 인터뷰 형식으로 정리한 실전 운영 기록"
};

const upcomingGuideTopics = [
  {
    title: "공영주차장 공매는 실제로 어떻게 받는가",
    description:
      "입찰 공고를 어디서 보고, 어떤 조건을 읽고, 실제로 무엇을 확인해야 하는지부터 따로 정리할 예정입니다."
  },
  {
    title: "입찰 전에 어떤 변수를 먼저 체크했어야 했는가",
    description:
      "재건축, 운영 주체, 무인화 가능 여부처럼 낙찰 전에 봤어야 했던 조건들을 운영 경험 기준으로 다시 정리합니다."
  }
];

const searchIntentLinks = [
  {
    label: "주차장 공매가 궁금하다면",
    href: "/blog/parking-auction-origin-part-1",
    description: "공매를 보다가 공영주차장을 낙찰받게 된 출발점부터 이어집니다."
  },
  {
    label: "주차장으로 사업하는 흐름이 궁금하다면",
    href: "/category/parking",
    description: "낙찰 이후 운영, 수익, 민원, 사고 대응까지 한 줄로 따라갈 수 있습니다."
  },
  {
    label: "낙찰 후 실제 운영이 궁금하다면",
    href: "/blog/parking-auction-reality-part-2",
    description: "행정, 인수인계, 무인화 한계처럼 시작 직후의 현실부터 볼 수 있습니다."
  }
];

export default async function HomePage() {
  const posts = await getAllPosts();
  const [featuredPost, ...otherPosts] = posts;
  const latestPosts = otherPosts.slice(0, 4);
  const firstPost = posts.at(-1) || null;
  const highlightOrder = [
    "parking-auction-origin-part-1",
    "parking-auction-lpr-error-part-6",
    "parking-auction-trash-fraud-part-8"
  ];
  const highlightPosts = highlightOrder
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter(Boolean);
  const parkingPosts = posts.filter((post) => post.category === "무인주차장");
  const groupedParkingPosts = groupPostsBySeriesType(parkingPosts);

  return (
    <div className="home-grid">
      <section className="intro-panel">
        <div className="intro-copy">
          <p className="eyebrow">처음 오신 분께</p>
          <h2>주차장 공매로 낙찰받은 뒤 실제 운영에서 벌어진 일을 AI 인터뷰로 기록합니다.</h2>
          <p>
            주차장 공매, 공영주차장 낙찰, 무인주차장 운영, 추가 수익 만들기,
            민원과 사고 대응까지 직장인이 직접 겪은 흐름을 제가 인터뷰 형식으로
            정리합니다. 잘 포장된 후기보다, 실제로 어떻게 버티고 풀었는지에
            가까운 기록입니다.
          </p>
          <ul className="intro-points">
            <li>주차장 공매를 보고 낙찰까지 간 출발점</li>
            <li>낙찰 후 실제 운영에서 터진 문제를 어떻게 처리했는지</li>
            <li>주변 변화를 읽고 어떻게 추가 수익을 만들었는지</li>
          </ul>
          <div className="intro-actions">
            {firstPost ? (
              <Link href={`/blog/${firstPost.slug}`} className="text-button">
                주차장 1편부터 보기
              </Link>
            ) : null}
            <Link href="/about" className="text-button">
              운영자와 인터뷰 방식 보기
            </Link>
          </div>
        </div>

        <div className="intro-aside">
          <div className="intro-card">
            <h3>이런 검색으로 들어오셨다면</h3>
            <ul className="intro-link-list">
              {searchIntentLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="intro-card">
            <h3>이 사이트를 읽는 이유</h3>
            <p>
              검색 결과에는 잘 안 남는 운영 감각, 즉 `이 상황에서 실제로 어떤 선택을 했는지`를
              사건 단위로 읽을 수 있습니다.
            </p>
          </div>

          <div className="intro-card">
            <h3>처음이라면</h3>
            <p>
              주차장 시리즈를 순서대로 읽으면 가장 잘 들어옵니다. 앞편의 판단이 뒷편의 대응으로
              이어지는 구조라서, 1편부터 읽을수록 맥락이 선명해집니다.
            </p>
          </div>

          <div className="intro-card">
            <h3>대표 사건 3개</h3>
            <ul className="intro-link-list">
              {highlightPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`}>
                    <strong>{post.title}</strong>
                    <span>{post.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="series-overview">
        <div className="section-head">
          <h2>이 사이트의 글은 크게 세 갈래입니다</h2>
          <p>처음 온 사람도 어디부터 읽을지 바로 고를 수 있게 나눴습니다.</p>
        </div>
        <div className="series-overview-grid">
          {groupedParkingPosts.map((group) => (
            <article key={group.key} className="series-overview-card">
              <p className="eyebrow">{group.posts.length}편 공개</p>
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <Link href="/category/parking" className="text-button">
                {group.label} 글 모아보기
              </Link>
              <ul className="series-overview-list">
                {group.posts.slice(0, 2).map((post) => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="series-overview">
        <div className="section-head">
          <h2>곧 추가할 입문형 글</h2>
          <p>운영기만으로는 부족한 부분이라, 공매를 처음 보는 사람용 가이드를 별도 축으로 보강합니다.</p>
        </div>
        <div className="series-overview-grid">
          {upcomingGuideTopics.map((topic) => (
            <article key={topic.title} className="series-overview-card upcoming-card">
              <p className="eyebrow">준비 중</p>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-grid">
        <Link
          href={`/blog/${featuredPost.slug}`}
          className="lead-card lead-card-link"
        >
          <div className="lead-visual">
            <img
              className="lead-visual-image"
              src={featuredPost.image || "/images/site-representative.jpg"}
              alt={featuredPost.imageAlt || featuredPost.title}
            />
            <span className="lead-badge">{featuredPost.category}</span>
          </div>

          <div className="lead-content">
            <p className="eyebrow">대표 연재</p>
            <h2>{featuredPost.title}</h2>
            <p className="lead-summary">{featuredPost.summary}</p>

            <div className="lead-footer">
              <div className="metric-row">
                <span>{featuredPost.publishedAt}</span>
                <span>조회 {featuredPost.views}</span>
                <span>좋아요 {featuredPost.likeCount}</span>
                <span>댓글 {featuredPost.commentCount}</span>
              </div>
            </div>
          </div>
        </Link>

        <aside className="latest-panel">
          <div className="section-head">
            <h2>최신 기사</h2>
            <p>최근 공개된 연재</p>
          </div>

          <ul className="latest-list">
            {posts.map((post) => (
              <li key={post.slug} className="latest-item">
                <a href={`/blog/${post.slug}`}>
                  <span className="latest-category">{post.category}</span>
                  <strong>{post.title}</strong>
                  <span className="latest-meta">
                    {post.publishedAt} · 조회 {post.views} · 좋아요{" "}
                    {post.likeCount} · 댓글{" "}
                    {post.commentCount}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="post-section">
        <div className="section-head">
          <h2>최신 스토리</h2>
        </div>

        <div className="post-list">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
