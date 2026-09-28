"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement;

      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href) return;

      // Ignore external links
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("#")
      ) {
        return;
      }

      // Ignore same page link
      if (href === pathname) {
        return;
      }

      setLoading(true);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#000103]/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-cyan-400/10" />

          <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/20" />

          <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-r-cyan-400 border-t-cyan-400" />

          <div className="absolute inset-4 rounded-full bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.5)]" />

          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]" />
        </div>

        <div className="flex items-center gap-1 text-xs font-medium tracking-[0.3em] text-white/40">
          <span>LOADING</span>

          <span className="animate-bounce [animation-delay:0ms]">.</span>

          <span className="animate-bounce [animation-delay:150ms]">.</span>

          <span className="animate-bounce [animation-delay:300ms]">.</span>
        </div>
      </div>
    </div>
  );
}
