import Link from "next/link";
import PostCard from "../../components/post-card";
import { getAllPosts, topicMeta } from "../../lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "운영노트 | Operator's Log",
  description: "사업 종류와 관계없이 여러 현장에서 반복해서 마주친 세무, 계약, 자동화, 운영 실수를 정리합니다."
};

const operationTopics = ["tax", "legal", "automation", "retrospective"];

export default async function OperationsPage({ searchParams }) {
  const { topic } = await searchParams;
  const posts = await getAllPosts();
  const selectedTopic = operationTopics.includes(topic) ? topic : null;
  const filteredPosts = selectedTopic
    ? posts.filter((post) => post.topics.includes(selectedTopic))
    : posts.filter((post) => post.topics.some((item) => operationTopics.includes(item)));

  return (
    <div className="category-page">
      <header className="category-header">
        <p className="eyebrow">Cross-business notes</p>
        <h1>운영노트</h1>
        <p className="category-summary">사업 종류와 관계없이 여러 현장에서 반복해서 마주친 세무, 계약, 자동화, 운영 실수를 정리합니다.</p>
      </header>
      <nav className="topic-filter" aria-label="운영노트 주제">
        <Link href="/operations" className={!selectedTopic ? "topic-chip is-active" : "topic-chip"}>전체</Link>
        {operationTopics.map((item) => <Link key={item} href={`/operations?topic=${item}`} className={selectedTopic === item ? "topic-chip is-active" : "topic-chip"}>{topicMeta[item].label}</Link>)}
      </nav>
      {filteredPosts.length ? (
        <section className="post-section">
          <div className="section-head">
            <h2>{selectedTopic ? topicMeta[selectedTopic].label : "운영하면서 배운 것"}</h2>
            <p>{filteredPosts.length}편의 기록</p>
          </div>
          <div className="post-list">
            {filteredPosts.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        </section>
      ) : <section className="category-empty"><p>이 주제의 글을 준비하고 있습니다.</p></section>}
    </div>
  );
}
