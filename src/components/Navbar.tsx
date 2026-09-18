"use client";

import React, { useState } from "react";
import { Code2, Component, Zap, Server, Menu, X } from "lucide-react";
import Link from "next/link";

import { useLayout } from "@/components/LayoutContext";

const navLinks = [
  {
    name: "JavaScript",
    href: "/javascript",
    icon: Code2,
  },
  {
    name: "React",
    href: "/react",
    icon: Component,
  },
  {
    name: "Next.js",
    href: "/nextjs",
    icon: Zap,
  },
  {
    name: "Node.js",
    href: "/nodejs",
    icon: Server,
  },
  {
    name: "Top30JS",
    href: "/top30js",
    icon: Server,
  },
];

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("JavaScript");

  const { navbarOpen, setNavbarOpen } = useLayout();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060A12]/95 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* =========================
              LOGO
          ========================== */}
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>

            <h1 className="text-lg font-semibold tracking-tight text-[#E4E9F2] sm:text-xl">
              Java
              <span className="bg-linear-to-r from-yellow-300 via-white to-cyan-300 bg-clip-text text-transparent">
                Script
              </span>
            </h1>
          </Link>

          {/* =========================
              DESKTOP NAVIGATION
          ========================== */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ name, href, icon: Icon }) => {
              const isActive = activeLink === name;

              return (
                <li key={name}>
                  <Link
                    href={href}
                    onClick={() => setActiveLink(name)}
                    className={`
                      group relative flex items-center gap-2
                      rounded-full px-4 py-2
                      text-sm font-medium
                      transition-all duration-200

                      ${
                        isActive
                          ? "text-yellow-400"
                          : "text-cyan-400 hover:scale-110 hover:text-white"
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute inset-0 -z-10 rounded-full bg-white/5 ring-1 ring-cyan-400/30" />
                    )}

                    <Icon
                      className={`
                        h-4 w-4
                        transition-colors duration-200

                        ${
                          isActive
                            ? "text-cyan-300"
                            : "text-gray-400 group-hover:text-cyan-300"
                        }
                      `}
                    />

                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* =========================
              RIGHT SIDE
          ========================== */}
          <div className="flex items-center gap-3">
            {/* About - Desktop */}
            <Link
              href="#"
              className="
                hidden
                items-center
                rounded-full
                border border-white/10
                px-4
                py-2
                text-sm
                font-medium
                text-[#E4E9F2]
                transition-all
                duration-300
                hover:border-cyan-400/50
                hover:shadow-[0_0_20px_-4px_rgba(79,209,255,0.55)]
                sm:inline-flex
              "
            >
              About
            </Link>

            {/* =========================
                NAVBAR HAMBURGER
            ========================== */}
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
      </div>

      {/* =========================
          MOBILE NAVBAR MENU
          ONLY navbarOpen controls this
      ========================== */}
      {navbarOpen && (
        <div
          className="
            border-t
            border-white/10
            bg-[#060A12]/95
            px-4
            pb-4
            pt-2
            backdrop-blur-xl
            md:hidden
          "
        >
          <ul className="flex flex-col gap-1">
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

                      ${
                        isActive ? "bg-white/5 text-[#E4E9F2]" : "text-gray-400"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-4 w-4
                        ${isActive ? "text-cyan-300" : "text-gray-400"}
                      `}
                    />

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
                  border border-white/10
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  text-[#E4E9F2]
                "
              >
                About
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
