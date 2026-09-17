"use client";
import React, { useState } from "react";
import { Code2, Component, Zap, Server, Menu, X } from "lucide-react";

const navLinks = [
  { name: "JavaScript", icon: Code2 },
  { name: "React", icon: Component },
  { name: "Next.js", icon: Zap },
  { name: "Node.js", icon: Server },
];

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("Javascript");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-[#E4E9F2] sm:text-xl">
              Learning
              <span className="bg-linear-to-r from-cyan-300 via-violet-400 to-cyan-300 bg-clip-text text-transparent animate-gradient">
                Hub
              </span>
            </h1>
          </div>

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ name, icon: Icon }) => {
              const isActive = activeLink === name;
              return (
                <li key={name}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveLink(name);
                    }}
                    className={`group bg-white relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive ? "text-white" : "text-black hover:text-grey"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 -z-10 rounded-full bg-white/6 ring-1 ring-cyan-400/30" />
                    )}
                    <Icon
                      className={`h-4 w-4 transition-colors duration-200 ${
                        isActive
                          ? "text-cyan-300"
                          : "text-grey group-hover:text-cyan-300"
                      }`}
                    />
                    {name}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="hidden items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#E4E9F2] transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_-4px_rgba(79,209,255,0.55)] sm:inline-flex"
            >
              About
            </a>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#E4E9F2] md:hidden"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/6 bg-[#060A12]/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map(({ name, icon: Icon }) => {
              const isActive = activeLink === name;
              return (
                <li key={name}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveLink(name);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-white/6 text-[#E4E9F2]" : "text-grey"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-cyan-300" : "text-grey"
                      }`}
                    />
                    {name}
                  </a>
                </li>
              );
            })}
            <li>
              <a
                href="#"
                className="mt-1 flex items-center rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-[#E4E9F2]"
              >
                About
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
