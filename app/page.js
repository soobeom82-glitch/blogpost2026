import PostCard from "../components/post-card";
import { getAllPosts } from "../lib/posts";

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div className="home-grid">
      <section className="hero-card">
        <p className="eyebrow">Interview-based business archive</p>
        <h1>직접 운영한 일만 남깁니다.</h1>
        <p className="hero-copy">
          무인주차장, 무인카페, 채굴, 세무. 잘 포장한 성공담보다 실제
          운영에서 겪은 시행착오와 판단 과정을 남기는 블로그입니다.
        </p>
      </section>

      <section className="post-section">
        <div className="section-head">
          <h2>연재 글</h2>
          <p>인터뷰를 바탕으로 한 운영 기록</p>
        </div>

        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
