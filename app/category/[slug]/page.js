import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../components/post-card";
import { getAllPosts } from "../../../lib/posts";

const categoryMap = {
  parking: {
    label: "주차장",
    matches: ["주차장", "무인주차장"],
    description:
      "공영주차장 낙찰, 무인화, 민원, 수요 변화, 운영 최적화까지 실제 주차장 운영에서 벌어진 사건을 모아둔 연재 아카이브입니다."
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
        <section className="post-section">
          <div className="section-head">
            <h2>{category.label} 연재</h2>
            <p>카테고리별로 모아보기</p>
          </div>

          <div className="post-list">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : (
        <section className="category-empty">
          <p>아직 공개된 글이 없습니다. 곧 이 카테고리의 연재가 추가됩니다.</p>
        </section>
      )}

      <section className="category-more">
        <div className="section-head">
          <h2>다른 연재 보기</h2>
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
