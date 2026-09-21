"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  X,
} from "lucide-react";

import { useLayout } from "@/components/LayoutContext";

type ContentTree =
  | {
      type: "folder";
      name: string;
      title: string;
      path: string[];
      children: ContentTree[];
    }
  | {
      type: "file";
      name: string;
      title: string;
      slug: string;
      path: string[];
      contentType: "markdown" | "javascript";
    };

type SidebarProps = {
  topics: ContentTree[];
  activeSlug: string;
  category: string;
};

/* ---------------------------------------------
   Tree Item
--------------------------------------------- */

function TreeItem({
  item,
  activeSlug,
  category,
  closeSidebar,
}: {
  item: ContentTree;
  activeSlug: string;
  category: string;
  closeSidebar: () => void;
}) {
  const activeParts = activeSlug.split("/");

  const folderContainsActive =
    item.type === "folder" &&
    item.path.every((part, index) => activeParts[index] === part);

  const [open, setOpen] = useState(
    item.type === "folder" ? folderContainsActive : false,
  );

  /* Automatically open the folder
     containing the current page */

  useEffect(() => {
    if (folderContainsActive) {
      setOpen(true);
    }
  }, [folderContainsActive]);

  /* ---------------------------------------------
     FILE
  --------------------------------------------- */

  if (item.type === "file") {
    const isActive = activeSlug === item.slug;

    return (
      <Link
        href={`/${category}/${item.slug}`}
        onClick={closeSidebar}
        className={`
          group flex items-center gap-2
          rounded-lg px-3 py-2
          text-sm transition-all duration-200
          ${
            isActive
              ? "bg-cyan-400/10 text-cyan-400"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }
        `}
      >
        {item.contentType === "javascript" ? (
          <FileCode2 className="h-4 w-4 shrink-0" />
        ) : (
          <FileText className="h-4 w-4 shrink-0" />
        )}

        <span className="truncate">{item.title}</span>
      </Link>
    );
  }

  /* ---------------------------------------------
     FOLDER
  --------------------------------------------- */

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          flex w-full items-center gap-2
          rounded-lg px-3 py-2
          text-left text-sm
          font-medium text-gray-300
          transition-all duration-200
          hover:bg-white/5
          hover:text-white
        "
      >
        <ChevronRight
          className={`
            h-4 w-4 shrink-0
            transition-transform duration-200
            ${open ? "rotate-90" : ""}
          `}
        />

        {open ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-cyan-400" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
        )}

        <span className="truncate">{item.title}</span>
      </button>

      {open && item.children.length > 0 && (
        <div className="ml-4 border-l border-white/10 pl-2">
          {item.children.map((child) => (
            <TreeItem
              key={child.path.join("/")}
              item={child}
              activeSlug={activeSlug}
              category={category}
              closeSidebar={closeSidebar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------
   Sidebar
--------------------------------------------- */

export default function Sidebar({
  topics,
  activeSlug,
  category,
}: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useLayout();

  return (
    <>
      {/* Mobile overlay */}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="
            fixed inset-0 top-16
            z-30 bg-black/60
            md:hidden
          "
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed left-0 top-16 z-40
          flex h-[calc(100vh-4rem)]
          w-64 flex-col
          border-r border-white/10
          bg-black
          p-4 sm:p-5
          transition-transform
          duration-300
          ease-in-out

          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Mobile header */}

        <div className="mb-5 flex items-center justify-between md:hidden">
          <h2 className="text-2xl font-bold capitalize text-cyan-400">
            {category}
          </h2>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg
              border border-white/10
              text-gray-400
              transition
              hover:border-cyan-400/50
              hover:text-cyan-400
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop title */}

        <h2
          className="
            mb-6 hidden shrink-0
            text-[30px] font-bold
            capitalize text-cyan-400
            md:block
          "
        >
          {category}
        </h2>

        {/* Tree */}

        <div
          className="
            hide-scrollbar
            flex-1
            overflow-y-auto
            space-y-1
          "
        >
          {topics.map((item) => (
            <TreeItem
              key={item.path.join("/")}
              item={item}
              activeSlug={activeSlug}
              category={category}
              closeSidebar={() => setSidebarOpen(false)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
