"use client";

import React, { useState } from "react";

import {
  Code2,
  Component,
  Zap,
  Server,
  Menu,
  X,
  FileCode2,
  Palette,
  Braces,
  Boxes,
  Network,
  ShieldCheck,
  Database,
  Radio,
  Container,
  Gauge,
  BrainCircuit,
  Workflow,
  ListTree,
} from "lucide-react";

import Link from "next/link";
import { useLayout } from "@/components/LayoutContext";

const navLinks = [
  { name: "HTML", href: "/html", icon: FileCode2 },
  { name: "CSS", href: "/css", icon: Palette },
  { name: "JavaScript", href: "/javascript", icon: Braces },
  { name: "TypeScript", href: "/typescript", icon: Code2 },
  { name: "React", href: "/react", icon: Component },
  { name: "Next.js", href: "/nextjs", icon: Zap },
  { name: "Node.js", href: "/nodejs", icon: Server },
  { name: "Express", href: "/express", icon: Boxes },
  { name: "REST APIs", href: "/rest-apis", icon: Network },
  { name: "Authentication", href: "/authentication", icon: ShieldCheck },
  { name: "Database", href: "/database", icon: Database },
  {
    name: "Real-Time",
    href: "/realtime-distributed-systems",
    icon: Radio,
  },
  { name: "DevOps", href: "/devops", icon: Container },
  { name: "Performance", href: "/performance", icon: Gauge },
  { name: "AI", href: "/ai", icon: BrainCircuit },
  { name: "System Design", href: "/system-design", icon: Workflow },
  { name: "DSA", href: "/dsa", icon: ListTree },
  { name: "Top30JS", href: "/top30js", icon: Code2 },
];

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("/");

  const { navbarOpen, setNavbarOpen } = useLayout();

  return (
    <nav
      className="
        sticky
        top-0
        z-50
        w-full
        shrink-0
        border-b
        border-white/10
        bg-[#060A12]/95
        backdrop-blur-xl
      "
    >
      {/* Top glow */}
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-px
          bg-linear-to-r
          from-transparent
          via-cyan-400/50
          to-transparent
        "
      />

      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =================================================
            DESKTOP / TOP BAR
        ================================================= */}
        <div
          className="
            flex
            min-h-16
            items-center
            justify-between
            gap-4
          "
        >
          {/* LOGO */}
          <Link
            href="/"
            className="
              flex
              shrink-0
              items-center
              gap-2.5
              transition-transform
              duration-200
              hover:scale-105
            "
          >
            <span className="relative flex h-2 w-2">
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-cyan-400
                  opacity-75
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-cyan-400
                "
              />
            </span>

            <h1
              className="
                text-lg
                font-semibold
                tracking-tight
                text-[#E4E9F2]
                sm:text-xl
              "
            >
              Java
              <span
                className="
                  bg-linear-to-r
                  from-yellow-300
                  via-white
                  to-cyan-300
                  bg-clip-text
                  text-transparent
                "
              >
                Script
              </span>
            </h1>
          </Link>

          {/* DESKTOP NAV */}
          <div
            className="
              hidden
              flex-1
              md:block
            "
          >
            <ul
              className="
                flex
                flex-wrap
                items-center
                justify-center
                gap-x-1
                gap-y-1
              "
            >
              {navLinks.map(({ name, href, icon: Icon }) => {
                const isActive = activeLink === name;

                return (
                  <li key={name}>
                    <Link
                      href={href}
                      onClick={() => setActiveLink(name)}
                      className={`
                        group
                        relative
                        flex
                        items-center
                        gap-1.5
                        whitespace-nowrap
                        rounded-md
                        px-2
                        py-1.5
                        text-[11px]
                        font-medium
                        transition-all
                        duration-200

                        ${
                          isActive
                            ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      <Icon
                        className={`
                          h-3.5
                          w-3.5
                          shrink-0

                          ${
                            isActive
                              ? "text-cyan-300"
                              : "text-slate-500 group-hover:text-cyan-300"
                          }
                        `}
                      />

                      <span>{name}</span>

                      {isActive && (
                        <span
                          className="
                            absolute
                            -bottom-1
                            left-1/2
                            h-0.5
                            w-3
                            -translate-x-1/2
                            rounded-full
                            bg-cyan-400
                          "
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex shrink-0 items-center gap-3">
            {/* ABOUT */}
            <Link
              href="#"
              className="
                hidden
                items-center
                rounded-full
                border
                border-white/10
                px-4
                py-2
                text-sm
                font-medium
                text-[#E4E9F2]
                transition-all
                duration-300
                hover:border-cyan-400/50
                hover:bg-cyan-400/5
                hover:text-cyan-300
                sm:inline-flex
              "
            >
              About
            </Link>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setNavbarOpen((value) => !value)}
              aria-label="Toggle navigation"
              aria-expanded={navbarOpen}
              className="
                inline-flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-white/10
                text-[#E4E9F2]
                transition-all
                duration-200
                hover:border-cyan-400/50
                hover:bg-cyan-400/5
                hover:text-cyan-400
                md:hidden
              "
            >
              {navbarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            MOBILE MENU
        ================================================= */}
        {navbarOpen && (
          <div
            className="
              border-t
              border-white/10
              bg-[#060A12]/95
              pb-4
              pt-2
              md:hidden
            "
          >
            <ul className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
              {navLinks.map(({ name, href, icon: Icon }) => {
                const isActive = activeLink === name;

                return (
                  <li key={name}>
                    <Link
                      href={href}
                      onClick={() => {
                        setActiveLink(name);
                        setNavbarOpen(false);
                      }}
                      className={`
                        flex
                        items-center
                        gap-3
                        rounded-lg
                        px-3
                        py-2.5
                        text-sm
                        font-medium
                        transition-all

                        ${
                          isActive
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      {name}
                    </Link>
                  </li>
                );
              })}

              <li>
                <Link
                  href="#"
                  onClick={() => setNavbarOpen(false)}
                  className="
                    mt-1
                    flex
                    items-center
                    rounded-lg
                    border
                    border-white/10
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    text-[#E4E9F2]
                    hover:border-cyan-400/30
                    hover:bg-cyan-400/5
                    hover:text-cyan-300
                  "
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
