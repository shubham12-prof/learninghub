"use client";

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LayoutProvider } from "@/components/LayoutContext";
import NavigationLoader from "./NavigationLoader";

function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-90px)] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />

          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin" />

          <div className="h-7 w-7 rounded-full bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.6)]" />

          <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse" />
        </div>

        <div className="flex items-center gap-1 text-sm text-white/50">
          <span>Loading</span>

          <span className="animate-bounce [animation-delay:0ms]">.</span>
          <span className="animate-bounce [animation-delay:150ms]">.</span>
          <span className="animate-bounce [animation-delay:300ms]">.</span>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <div className="flex min-h-screen flex-col bg-[#000103]">
        <Navbar />

        <main className="flex-1">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <NavigationLoader />
        <Footer />
      </div>
    </LayoutProvider>
  );
}
