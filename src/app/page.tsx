"use client";

import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Component,
  Layers3,
  Server,
  Sparkles,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";

const learningPaths = [
  {
    title: "JavaScript",
    ext: ".js",
    description:
      "Master the fundamentals, advanced concepts, and patterns you need to write better JavaScript.",
    href: "/javascript",
    icon: Code2,
    accent: "#F2C94C",
    accentSoft: "rgba(242,201,76,0.08)",
    topics: ["ES6+", "Async", "Patterns"],
  },
  {
    title: "React",
    ext: ".jsx",
    description:
      "Understand React from components and hooks to advanced patterns and performance.",
    href: "/react",
    icon: Component,
    accent: "#5ED3F3",
    accentSoft: "rgba(94,211,243,0.08)",
    topics: ["Hooks", "Context", "Performance"],
  },
  {
    title: "Next.js",
    ext: ".tsx",
    description:
      "Learn modern full-stack development with Next.js, routing, rendering, APIs, and more.",
    href: "/nextjs",
    icon: Layers3,
    accent: "#E5E9F0",
    accentSoft: "rgba(229,233,240,0.06)",
    topics: ["App Router", "SSR", "API"],
  },
  {
    title: "Node.js",
    ext: ".mjs",
    description:
      "Understand Node.js architecture, core modules, APIs, and backend development.",
    href: "/nodejs",
    icon: Server,
    accent: "#7BD88F",
    accentSoft: "rgba(123,216,143,0.08)",
    topics: ["Express", "APIs", "Database"],
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Structured learning",
    description:
      "Clear paths designed to build strong foundations, one concept at a time.",
  },
  {
    icon: Zap,
    title: "Practical code",
    description: "Real examples you can run, tweak, and actually understand.",
  },
  {
    icon: Target,
    title: "Interview ready",
    description: "Focused prep built around the questions real interviews ask.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0A0D12] text-slate-200 font-features-['ss01']">
      {/* ============ HERO ============ */}
      <section className="relative">
        {/* subtle grid, restrained */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-105 w-155 -translate-x-1/2 rounded-full bg-[#F0A84E]/[0.07] blur-[130px]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl flex-col items-center justify-center px-4 py-14 sm:px-6 sm:py-20">
          <div className="w-full max-w-4xl">
            {/* Editor tab bar — grounds the hero in the actual subject */}
            <div className="mx-auto mb-8 flex max-w-md items-center gap-2 rounded-t-lg border border-b-0 border-white/10 bg-white/3 px-3 py-2 sm:mb-10">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/70" />
              <span className="ml-2 truncate font-mono text-[11px] text-slate-500">
                learn.tsx — devhub
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-center font-bold leading-[1.05] tracking-tight text-white text-[clamp(2.5rem,6vw+1rem,6.5rem)]">
              Learn. <span className="text-[#F0A84E]">Build.</span>
              <br />
              <span className="relative inline-block">
                Master.
                <svg
                  className="absolute -bottom-1 left-0 w-full sm:-bottom-2"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9C50 3 150 3 298 9"
                    stroke="#F0A84E"
                    strokeOpacity="0.6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-xl text-center text-sm leading-7 text-slate-400 sm:mt-8 sm:text-base sm:leading-8 lg:text-lg">
              Everything you need to grow as a developer — JavaScript, React,
              Next.js, and Node.js — through structured concepts, real code, and
              interview-focused practice, all in one place.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/javascript"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#F0A84E] px-6 py-3.5 font-semibold text-[#191204] transition hover:bg-[#F5B968] sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Start learning</span>
                <ArrowRight
                  size={18}
                  className="relative transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/javascript"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/2 px-6 py-3.5 font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/5 sm:w-auto"
              >
                <Target size={18} />
                Prepare for interviews
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-3 gap-3 border-t border-white/10 pt-7 text-center sm:mt-16 sm:gap-8 sm:pt-8">
              {[
                { value: "4+", label: "Learning paths" },
                { value: "100+", label: "Concepts" },
                { value: "500+", label: "Code examples" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-bold text-white xs:text-xl sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="border-t border-white/6 bg-[#0C1017]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-px overflow-hidden rounded-xl border border-white/6 bg-white/6 sm:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group flex gap-4 bg-[#0C1017] p-6 transition hover:bg-white/2 sm:flex-col sm:gap-3 sm:p-7"
                >
                  <span className="select-none font-mono text-xs text-slate-600 sm:text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0A84E]/20 bg-[#F0A84E]/6 text-[#F0A84E]">
                      <Icon size={17} />
                    </div>
                    <h3 className="text-base font-semibold text-white sm:text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ LEARNING PATHS ============ */}
      <section className="relative border-t border-white/6">
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 text-center sm:mb-14">
            <p className="font-mono text-xs text-[#F0A84E] sm:text-sm">
              // learning paths
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Choose what you want to learn
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
              Follow a structured path and build your knowledge one concept at a
              time.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {learningPaths.map((path) => {
              const Icon = path.icon;
              return (
                <Link
                  key={path.title}
                  href={path.href}
                  className="group relative overflow-hidden rounded-xl border border-white/8 bg-[#0C1017] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/16 sm:p-7"
                  style={{ ["--accent" as string]: path.accent }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: path.accentSoft }}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition group-hover:scale-105"
                      style={{
                        borderColor: `${path.accent}33`,
                        background: path.accentSoft,
                        color: path.accent,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="rounded border border-white/10 bg-white/3 px-2 py-1 font-mono text-[11px] text-slate-500">
                      {path.ext}
                    </span>
                  </div>

                  <h3 className="relative mt-5 text-xl font-bold text-white sm:text-2xl">
                    {path.title}
                  </h3>

                  <p className="relative mt-2.5 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                    {path.description}
                  </p>

                  <div className="relative mt-5 flex flex-wrap gap-2">
                    {path.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-white/10 bg-white/3 px-2.5 py-1 text-xs text-slate-400"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div
                    className="relative mt-5 inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: path.accent }}
                  >
                    Start learning
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="relative border-t border-white/6 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-130 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F0A84E]/6 blur-[130px]" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#F0A84E]/20 bg-[#F0A84E]/6 text-[#F0A84E]">
            <Code2 size={22} />
          </div>

          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Learn faster.{" "}
            <span className="text-[#F0A84E]">Remember better.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8 lg:text-lg">
            Understand the fundamentals, practice real code, revise important
            concepts, and prepare for technical interviews — without jumping
            between different resources.
          </p>

          <Link
            href="/javascript"
            className="group mt-8 inline-flex items-center gap-2 rounded-lg border border-[#F0A84E]/30 bg-[#F0A84E]/8 px-6 py-3.5 font-semibold text-[#F0A84E] transition hover:border-[#F0A84E]/50 hover:bg-[#F0A84E]/[0.14]"
          >
            Start your journey
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </main>
  );
}
