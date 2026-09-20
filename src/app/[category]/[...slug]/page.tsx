import { notFound } from "next/navigation";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import CodeRenderer from "@/components/CodeRenderer";
import Sidebar from "@/components/Sidebar";
import SidebarToggle from "@/components/SidebarToggle";

import { getAllCategories, getAllTopics, getTopicContent } from "@/lib/content";

type PageProps = {
  params: Promise<{
    category: string;
    slug: string[];
  }>;
};

/**
 * Generate every possible URL
 *
 * Example:
 *
 * {
 *   category: "react",
 *   slug: [
 *     "01-React-Fundamentals",
 *     "02-JSX"
 *   ]
 * }
 */
export function generateStaticParams() {
  const categories = getAllCategories();

  return categories.flatMap((category) => {
    const topics = getAllTopics(category);

    return topics.map((topic) => ({
      category,
      slug: topic.path,
    }));
  });
}

export default async function Page({ params }: PageProps) {
  const { category, slug } = await params;

  /**
   * Find the requested markdown/javascript file
   */
  const topic = getTopicContent(category, slug);

  if (!topic) {
    notFound();
  }

  /**
   * Get every topic for the sidebar
   */
  const topics = getAllTopics(category);

  /**
   * Convert:
   *
   * ["01-React-Fundamentals", "02-JSX"]
   *
   * into:
   *
   * "01-React-Fundamentals/02-JSX"
   */
  const activeSlug = slug.join("/");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar topics={topics} activeSlug={activeSlug} category={category} />

      {/* Mobile toggle */}
      <SidebarToggle />

      {/* Main Content */}
      <main
        className="
          min-h-[calc(100vh-4rem)]
          min-w-0
          w-full
          px-3
          py-6
          sm:px-6
          sm:py-8
          md:ml-64
          md:w-[calc(100%-16rem)]
        "
      >
        <div className="mx-auto w-full max-w-5xl">
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
