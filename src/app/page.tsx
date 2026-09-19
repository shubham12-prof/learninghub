import Link from "next/link";
import {
  Code2,
  Atom,
  Layers3,
  Server,
  ArrowRight,
  BookOpen,
  Terminal,
  Brain,
} from "lucide-react";

const learningPaths = [
  {
    title: "JavaScript",
    description:
      "Master JavaScript fundamentals, advanced concepts, algorithms, and real-world patterns.",
    href: "/javascript",
    icon: Code2,
    topics: "Core concepts • Advanced JS • Practice",
  },
  {
    title: "React",
    description:
      "Learn React from components and hooks to advanced patterns and performance optimization.",
    href: "/react",
    icon: Atom,
    topics: "Hooks • Components • Advanced React",
  },
  {
    title: "Next.js",
    description:
      "Build modern full-stack applications with routing, rendering, APIs, and deployment.",
    href: "/nextjs",
    icon: Layers3,
    topics: "App Router • SSR • APIs",
  },
  {
    title: "Node.js",
    description:
      "Understand Node.js internals, core modules, APIs, architecture, and backend development.",
    href: "/nodejs",
    icon: Server,
    topics: "Architecture • APIs • Backend",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Structured Learning",
    description:
      "Topics are organized in a logical order so you can build knowledge step by step.",
  },
  {
    icon: Terminal,
    title: "Code First",
    description:
      "Learn concepts through practical examples and runnable code instead of theory alone.",
  },
  {
    icon: Brain,
    title: "Interview Ready",
    description:
      "Revise important concepts and practice questions while building strong fundamentals.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your developer learning hub
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Learn.
              <span className="text-blue-400"> Build.</span>
              <br />
              <span className="text-slate-300">Master.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
              A structured place to learn JavaScript, React, Next.js, and
              Node.js through practical concepts, code examples, and
              interview-focused preparation.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/javascript"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-400"
              >
                Start Learning
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/nodejs"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3.5 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Explore Node.js
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">
            Learning Paths
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Choose what you want to learn
          </h2>

          <p className="mt-4 max-w-2xl text-slate-400">
            Follow a structured path or jump directly into the technology you
            want to practice.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {learningPaths.map((path) => {
            const Icon = path.icon;

            return (
              <Link
                key={path.title}
                href={path.href}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-900"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-blue-400">
                    <Icon size={24} />
                  </div>

                  <ArrowRight
                    size={20}
                    className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-400"
                  />
                </div>

                <h3 className="text-2xl font-bold">{path.title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {path.description}
                </p>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {path.topics}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Learn with a purpose
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Everything is designed to help you understand concepts and
              actually use them.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-blue-400">
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to start learning?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Pick a technology and start working through the concepts one step at a
          time.
        </p>

        <Link
          href="/javascript"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 font-semibold transition hover:bg-blue-400"
        >
          Start Learning
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <p>Learning Hub • Learn. Build. Master.</p>
      </footer>
    </main>
  );
}
