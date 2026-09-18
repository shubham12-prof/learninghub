"use client";

import Link from "next/link";

type Topic = {
  slug: string;
  title: string;
  type: "markdown" | "javascript";
};

type SidebarProps = {
  topics: Topic[];
  activeSlug: string;
  category: string;
};

export default function Sidebar({
  topics,
  activeSlug,
  category,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-white/10 bg-black p-5">
      <h2 className="mb-8 shrink-0 text-[30px] font-bold capitalize text-cyan-400">
        {category}
      </h2>

      <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/${category}/${topic.slug}`}
            className={`
      block rounded-lg px-3 py-2 transition

      ${
        activeSlug === topic.slug
          ? "bg-cyan-400/10 text-cyan-400"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }
    `}
          >
            <div className="flex items-center gap-2">
              <span>{topic.type === "javascript" ? "⚡" : "📖"}</span>

              <span className="capitalize">{topic.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
