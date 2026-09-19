import { notFound } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CodeRenderer from "@/components/CodeRenderer";
import Sidebar from "@/components/Sidebar";
import SidebarToggle from "@/components/SidebarToggle";
import { getAllCategories, getAllTopics, getTopicContent } from "@/lib/content";
type PageProps = { params: Promise<{ category: string; slug: string }> };
export function generateStaticParams() {
  const categories = getAllCategories();
  return categories.flatMap((category) => {
    const topics = getAllTopics(category);
    return topics.map((topic) => ({ category, slug: topic.slug }));
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
      {" "}
      <Sidebar topics={topics} activeSlug={slug} category={category} />{" "}
      <SidebarToggle />{" "}
      <main className=" min-h-[calc(100vh-4rem)] w-full min-w-0 px-3 py-6 sm:px-6 sm:py-8 md:ml-64 md:w-[calc(100%-16rem)] ">
        {" "}
        <div className="mx-auto w-full min-w-0 max-w-5xl">
          {" "}
          {topic.type === "markdown" ? (
            <MarkdownRenderer content={topic.content} />
          ) : (
            <CodeRenderer content={topic.content} language="javascript" />
          )}{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
