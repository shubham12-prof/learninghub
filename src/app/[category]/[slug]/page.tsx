import { notFound } from "next/navigation";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import CodeRenderer from "@/components/CodeRenderer";
import Sidebar from "@/components/Sidebar";

import { getAllCategories, getAllTopics, getTopicContent } from "@/lib/content";

type PageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export function generateStaticParams() {
  const categories = getAllCategories();

  return categories.flatMap((category) => {
    const topics = getAllTopics(category);

    return topics.map((topic) => ({
      category,
      slug: topic.slug,
    }));
  });
}

export default async function Page({ params }: PageProps) {
  const { category, slug } = await params;

  const topic = getTopicContent(category, slug);

  if (!topic) {
    notFound();
  }

  const topics = getAllTopics(category);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar topics={topics} activeSlug={slug} category={category} />

      {/* Main Content */}
      <main className="ml-64 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {topic.type === "markdown" ? (
            <MarkdownRenderer content={topic.content} />
          ) : (
            <CodeRenderer content={topic.content} language="javascript" />
          )}
        </div>
      </main>
    </div>
  );
}
