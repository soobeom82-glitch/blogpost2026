import PostCard from "../../components/post-card";
import { getPostsBySection } from "../../lib/posts";
import { canonical } from "../../lib/site";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "여행·생활 기록 | Operator's Log",
  description: "여행과 일상에서 직접 겪고 확인한 개인 경험을 모읍니다. 해외 렌터카 이용과 비용 확인 등 실용적인 후기를 기록합니다.",
  alternates: canonical("/personal"),
};

export default async function PersonalPage() {
  const posts = await getPostsBySection("personal");
  return (
    <section className="post-section personal-archive">
      <div className="section-head">
        <h2>여행과 일상에서 남긴 기록</h2>
        <p>{posts.length}편의 개인 기록 · 사업 글과 별도 분류</p>
      </div>
      <div className="post-list">
        {posts.map((post) => <PostCard key={post.slug} post={post} />)}
      </div>
    </section>
  );
}
