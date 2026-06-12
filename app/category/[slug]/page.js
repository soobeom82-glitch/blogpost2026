import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../../../lib/posts";

const parkingUpcomingTopics = [
  {
    title: "공영주차장 공매는 실제로 어떻게 받는가",
    description:
      "공고 확인부터 입찰, 현장 확인, 서류 이해까지 처음 진입하는 사람 기준으로 따로 정리할 예정입니다."
  },
  {
    title: "입찰 전에 어떤 조건을 먼저 확인했어야 했는가",
    description:
      "무인화 가능 여부, 주변 재건축, 운영 조건처럼 낙찰 전에 놓치면 큰 변수였던 항목들을 되짚습니다."
  }
];

const categoryMap = {
  parking: {
    label: "주차장",
    matches: ["주차장", "무인주차장"],
    description:
      "공영주차장 낙찰부터 민원, 사고, 영업, 수익화까지. 직장인이 직접 운영하며 겪은 문제 해결과 수요 발굴, 사업 판단을 AI 인터뷰 형식으로 기록한 아카이브입니다. 운영기와 별도로 공매·입찰 가이드도 이어서 보강할 예정입니다."
  },
  cafe: {
    label: "무인카페",
    matches: ["무인카페"],
    description:
      "무인카페에서 벌어진 시설 파손, 출입 이슈, 손님 대응, 공간 운영의 현실을 인터뷰 기반 글로 정리할 카테고리입니다."
  }
};

export async function generateStaticParams() {
  return Object.keys(categoryMap).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = categoryMap[slug];

  if (!category) {
    return {};
  }

  return {
    title: `${category.label} | Operator's Log`,
    description: category.description
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = categoryMap[slug];

  if (!category) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) => category.matches.includes(post.category));
  const otherPosts = allPosts.filter((post) => !category.matches.includes(post.category));
  const firstPost = posts.at(-1) || null;
  const groupedPosts = groupPostsBySeriesType(posts);

  return (
    <div className="category-page">
      <header className="category-header">
        <p className="eyebrow">Category</p>
        <h1>{category.label}</h1>
        <p className="category-summary">{category.description}</p>
        <div className="category-meta-row">
          <p className="category-count">현재 공개 글 {posts.length}편</p>
          {firstPost ? (
            <Link href={`/blog/${firstPost.slug}`} className="text-button category-first-link">
              첫편 보기
            </Link>
          ) : null}
        </div>
      </header>

      {posts.length ? (
        <section className="series-overview">
          <div className="section-head">
            <h2>{category.label} 연재는 이렇게 나뉩니다</h2>
            <p>문제 해결, 수요 발굴, 사업 판단으로 묶어서 보면 흐름이 더 잘 보입니다.</p>
          </div>
          <div className="series-overview-grid">
            {groupedPosts.map((group) => (
              <article key={group.key} className="series-overview-card">
                <p className="eyebrow">{group.posts.length}편 공개</p>
                <h3>{group.label}</h3>
                <p>{group.description}</p>
                <ul className="series-overview-list">
                  {group.posts.slice(0, 3).map((post) => (
                    <li key={post.slug}>
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="category-empty">
          <p>아직 공개된 글이 없습니다. 곧 이 카테고리의 연재가 추가됩니다.</p>
        </section>
      )}

      {slug === "parking" ? (
        <section className="series-overview">
          <div className="section-head">
            <h2>이 카테고리에 곧 추가할 입문형 글</h2>
            <p>운영 기록과 별개로, 처음 공매를 보는 사람을 위한 가이드형 글도 따로 쌓아갈 예정입니다.</p>
          </div>
          <div className="series-overview-grid">
            {parkingUpcomingTopics.map((topic) => (
              <article key={topic.title} className="series-overview-card upcoming-card">
                <p className="eyebrow">준비 중</p>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section className="category-series-groups">
          {groupedPosts.map((group) => (
            <section key={group.key} className="post-section">
              <div className="section-head">
                <h2>{group.label}</h2>
                <p>{group.description}</p>
              </div>

              <div className="post-list">
                {group.posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

      <section className="category-more">
        <div className="section-head">
          <h2>다른 연재 보기</h2>
          <p>주차장 외 다른 운영 아카이브도 여기에 이어집니다.</p>
        </div>

        <div className="latest-list-wrap">
          {otherPosts.length ? (
            <ul className="latest-list">
              {otherPosts.slice(0, 4).map((post) => (
                <li key={post.slug} className="latest-item">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="latest-category">{post.category}</span>
                    <strong>{post.title}</strong>
                    <span className="latest-meta">
                      {post.publishedAt} · 조회 {post.views} · 좋아요 {post.likeCount}
                      {" · "}댓글 {post.commentCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>아직 다른 카테고리에 공개된 글이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
