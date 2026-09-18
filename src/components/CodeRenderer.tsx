"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeRendererProps = {
  content: string;
  language?: string;
};

export default function CodeRenderer({
  content,
  language = "javascript",
}: CodeRendererProps) {
  return (
    <div className="my-7 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-xl">
      {/* Code Header */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#161b22] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />

        <span className="h-3 w-3 rounded-full bg-yellow-400" />

        <span className="h-3 w-3 rounded-full bg-green-400" />

        <span className="ml-3 text-xs text-gray-400">{language}</span>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "24px",
          background: "#0d1117",
          fontSize: "14px",
          lineHeight: "1.7",
        }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
