import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../components/post-card";
import { getAllPosts, groupPostsBySeriesType } from "../../../lib/posts";

const categoryMap = {
  parking: {
    label: "주차장",
    matches: ["주차장", "무인주차장", "주차장 가이드"],
    description:
      "주차장 공매, 공영주차장 낙찰, 무인주차장 운영, 추가 수익 만들기, 민원과 사고 대응까지. 입찰 전 가이드와 실제 운영 기록을 분리해 정리한 주차장 아카이브입니다."
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
    title:
      slug === "parking"
        ? "주차장 공매, 낙찰, 운영 기록 | Operator's Log"
        : `${category.label} | Operator's Log`,
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
  const firstGuidePost =
    posts.find((post) => post.slug === "parking-auction-guide-part-1") || null;
  const firstPost =
    posts.find((post) => post.slug === "parking-auction-origin-part-1") || null;
  const groupedPosts = groupPostsBySeriesType(posts);

  return (
    <div className="category-page">
      <header className="category-header">
        <p className="eyebrow">Category</p>
        <h1>{category.label}</h1>
        <p className="category-summary">{category.description}</p>
        <div className="category-meta-row">
          <p className="category-count">현재 공개 글 {posts.length}편</p>
          {firstGuidePost ? (
            <Link href={`/blog/${firstGuidePost.slug}`} className="text-button category-first-link">
              가이드부터 보기
            </Link>
          ) : null}
          {firstPost ? (
            <Link href={`/blog/${firstPost.slug}`} className="text-button category-first-link">
              실전 1편 보기
            </Link>
          ) : null}
        </div>
      </header>

      {posts.length ? (
        <section className="series-overview">
          <div className="section-head">
            <h2>{category.label} 연재는 이렇게 나뉩니다</h2>
            <p>입찰 전 가이드와 공매 이후 실제 운영 기록을 나눠서 읽을 수 있습니다.</p>
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
