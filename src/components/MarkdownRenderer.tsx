"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

type MarkdownRendererProps = {
  content: string;
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // =========================
          // H1
          // =========================

          h1: ({ children }) => (
            <h1 className="mt-10 mb-6 text-4xl font-extrabold">
              <span className="bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {children}
              </span>
            </h1>
          ),

          // =========================
          // H2
          // =========================

          h2: ({ children }) => (
            <h2 className="mt-10 mb-5 flex items-center gap-2 border-b border-white/10 pb-3 text-2xl font-bold text-cyan-400">
              <span className="text-blue-400">▸</span>
              {children}
            </h2>
          ),

          // =========================
          // H3
          // =========================

          h3: ({ children }) => (
            <h3 className="mt-8 mb-4 text-xl font-bold text-purple-400">
              {children}
            </h3>
          ),

          // =========================
          // PARAGRAPH
          // =========================

          p: ({ children }) => (
            <p className="mb-5 text-[16px] leading-8 text-gray-300">
              {children}
            </p>
          ),

          // =========================
          // BOLD
          // =========================

          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),

          // =========================
          // INLINE CODE
          // =========================

          code: ({ children, className }) => {
            const isCodeBlock = className?.includes("language-");

            if (!isCodeBlock) {
              return (
                <code className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 font-mono text-sm text-cyan-300">
                  {children}
                </code>
              );
            }

            return <code className={className}>{children}</code>;
          },

          // =========================
          // CODE BLOCK
          // =========================

          pre: ({ children }) => (
            <div className="my-7 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-xl">
              {/* Code Header */}

              <div className="flex items-center gap-2 border-b border-white/10 bg-[#161b22] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />

                <span className="h-3 w-3 rounded-full bg-yellow-400" />

                <span className="h-3 w-3 rounded-full bg-green-400" />

                <span className="ml-3 text-xs text-gray-500">JavaScript</span>
              </div>

              {/* Code */}

              <pre className="overflow-x-auto p-5 text-sm leading-7">
                {children}
              </pre>
            </div>
          ),

          // =========================
          // UL
          // =========================

          ul: ({ children }) => (
            <ul className="my-5 ml-6 list-disc space-y-3 marker:text-cyan-400">
              {children}
            </ul>
          ),

          // =========================
          // OL
          // =========================

          ol: ({ children }) => (
            <ol className="my-5 ml-6 list-decimal space-y-4 marker:font-bold marker:text-purple-400">
              {children}
            </ol>
          ),

          // =========================
          // LI
          // =========================

          li: ({ children }) => (
            <li className="pl-2 leading-7 text-gray-300">{children}</li>
          ),

          // =========================
          // BLOCKQUOTE
          // =========================

          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-xl border-l-4 border-cyan-400 bg-cyan-400/5 px-5 py-4 text-gray-300">
              💡 {children}
            </blockquote>
          ),

          // =========================
          // HR
          // =========================

          hr: () => <hr className="my-10 border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
