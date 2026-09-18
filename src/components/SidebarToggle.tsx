"use client";

import { Menu } from "lucide-react";
import { useLayout } from "@/components/LayoutContext";

export default function SidebarToggle() {
  const { sidebarOpen, setSidebarOpen } = useLayout();

  // When sidebar is open, don't show another X button here.
  // The Sidebar itself has the close button.
  if (sidebarOpen) {
    return null;
  }

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      aria-label="Open topics"
      className="
        fixed
        left-3
        top-18
        z-50

        flex
        h-9
        w-9
        items-center
        justify-center

        rounded-lg
        border
        border-white/10
        bg-black

        text-gray-300

        shadow-lg

        transition-all
        duration-200

        hover:border-cyan-400/50
        hover:text-cyan-400

        md:hidden
      "
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
