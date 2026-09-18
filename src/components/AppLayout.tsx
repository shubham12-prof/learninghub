"use client";

import Navbar from "@/components/Navbar";
import { LayoutProvider } from "@/components/LayoutContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <Navbar />

      {children}
    </LayoutProvider>
  );
}
