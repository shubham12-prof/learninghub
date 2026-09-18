"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { useLayout } from "@/components/LayoutContext";

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
  const { sidebarOpen, setSidebarOpen } = useLayout();

  return (
    <>
      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="
            fixed
            inset-0
            top-16
            z-30
            bg-black/60
            md:hidden
          "
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={`
          fixed
          left-0
          top-16
          z-40

          flex
          h-[calc(100vh-4rem)]
          w-64
          flex-col

          border-r
          border-white/10
          bg-black

          p-4
          sm:p-5

          transition-transform
          duration-300
          ease-in-out

          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* =========================
            MOBILE SIDEBAR HEADER
        ========================== */}
        <div className="mb-5 flex items-center justify-between md:hidden">
          <h2 className="text-2xl font-bold capitalize text-cyan-400">
            {category}
          </h2>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-white/10
              text-gray-400
              transition
              hover:border-cyan-400/50
              hover:text-cyan-400
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* =========================
            DESKTOP TITLE
        ========================== */}
        <h2
          className="
            mb-8
            hidden
            shrink-0
            text-[30px]
            font-bold
            capitalize
            text-cyan-400
            md:block
          "
        >
          {category}
        </h2>

        {/* =========================
            TOPICS
        ========================== */}
        <div className="hide-scrollbar flex-1 space-y-2 overflow-y-auto">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/${category}/${topic.slug}`}
              onClick={() => setSidebarOpen(false)}
              className={`
                block
                rounded-lg
                px-3
                py-2.5
                transition-all
                duration-200

                ${
                  activeSlug === topic.slug
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0">
                  {topic.type === "javascript" ? "⚡" : "📖"}
                </span>

                <span className="truncate capitalize">{topic.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
