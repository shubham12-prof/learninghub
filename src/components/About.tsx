import Link from "next/link";
import {
  Code2,
  Braces,
  Component,
  Server,
  Database,
  BrainCircuit,
  Workflow,
  ListTree,
  ArrowRight,
} from "lucide-react";

const topics = [
  {
    name: "JavaScript",
    href: "/javascript",
    icon: Braces,
  },
  {
    name: "TypeScript",
    href: "/typescript",
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
    icon: Code2,
  },
  {
    name: "Node.js",
    href: "/nodejs",
    icon: Server,
  },
  {
    name: "Database",
    href: "/database",
    icon: Database,
  },
  {
    name: "AI",
    href: "/ai",
    icon: BrainCircuit,
  },
  {
    name: "System Design",
    href: "/system-design",
    icon: Workflow,
  },
  {
    name: "DSA",
    href: "/dsa",
    icon: ListTree,
  },
];

export default function About() {
  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-cyan-400/5
          blur-[120px]
        "
      />
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/2 p-6">
        <h2 className="text-xl font-semibold text-white">Want to reach out?</h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Have a suggestion, found an issue, or want to discuss something? Feel
          free to get in touch.
        </p>

        <a
          href="mailto:makeyourdream12@gmail.com"
          className="
      mt-5
      inline-flex
      items-center
      rounded-lg
      border
      border-cyan-400/20
      bg-cyan-400/5
      px-4
      py-2.5
      text-sm
      font-medium
      text-cyan-300
      transition-all
      hover:border-cyan-400/40
      hover:bg-cyan-400/10
    "
        >
          makeyourdream12@gmail.com
        </a>
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <div
            className="
              mb-4
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-cyan-400/20
              bg-cyan-400/5
              px-3
              py-1.5
              text-xs
              font-medium
              text-cyan-300
            "
          >
            <Code2 className="h-3.5 w-3.5" />
            JavaScript Learning Hub
          </div>

          <h2
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
              sm:text-4xl
              lg:text-5xl
            "
          >
            Learn.
            <span className="bg-linear-to-r from-yellow-300 via-white to-cyan-300 bg-clip-text text-transparent">
              {" "}
              Build.
            </span>
            <span className="text-cyan-400"> Grow.</span>
          </h2>

          <p
            className="
              mt-6
              max-w-2xl
              text-base
              leading-8
              text-slate-400
            "
          >
            This is a personal learning hub focused on JavaScript and modern web
            development. Explore concepts, practical notes, interview
            preparation, and the technologies that make up the modern JavaScript
            ecosystem.
          </p>

          <p
            className="
              mt-4
              max-w-2xl
              text-base
              leading-8
              text-slate-500
            "
          >
            Everything is organized in one place so you can learn new concepts,
            revise what you already know, and keep building.
          </p>
        </div>

        <div className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cyan-400">What's inside</p>

              <h3 className="mt-2 text-2xl font-semibold text-white">
                Explore the ecosystem
              </h3>
            </div>
          </div>

          <div
            className="
              mt-8
              grid
              gap-3
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {topics.map((topic) => {
              const Icon = topic.icon;

              return (
                <Link
                  key={topic.name}
                  href={topic.href}
                  className="
                    group
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    border
                    border-white/10
                    bg-white/2
                    p-4
                    transition-all
                    duration-200
                    hover:border-cyan-400/25
                    hover:bg-cyan-400/3
                  "
                >
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-white/10
                      bg-white/3
                      transition-colors
                      group-hover:border-cyan-400/20
                      group-hover:bg-cyan-400/10
                    "
                  >
                    <Icon
                      className="
                        h-5
                        w-5
                        text-slate-400
                        transition-colors
                        group-hover:text-cyan-300
                      "
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-200">
                      {topic.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-600">
                      Explore topics
                    </p>
                  </div>

                  <ArrowRight
                    className="
                      h-4
                      w-4
                      text-slate-600
                      transition-all
                      duration-200
                      group-hover:translate-x-1
                      group-hover:text-cyan-400
                    "
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <div
          className="
            mt-14
            flex
            flex-col
            gap-6
            rounded-2xl
            border
            border-white/10
            bg-white/2
            p-6
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:p-8
          "
        >
          <div>
            <h3 className="text-lg font-semibold text-white">
              Built for developers who keep learning.
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Use this hub as a reference while learning, building projects,
              preparing for interviews, or revising concepts.
            </p>
          </div>

          <Link
            href="/javascript"
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-cyan-400
              px-5
              py-2.5
              text-sm
              font-semibold
              text-black
              transition-all
              hover:bg-cyan-300
              hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.6)]
            "
          >
            Start Learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-600">
            Have a suggestion, found an issue, or want to discuss something?
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Feel free to reach out through the contact details or social links
            available on the site.
          </p>
        </div>
      </div>
    </section>
  );
}
