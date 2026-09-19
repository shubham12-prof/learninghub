# Behavioral Questions & Interview Tips

## Common Follow-Up / Deep-Dive Questions

- "Walk me through how you'd decide the rendering strategy for a new page — SSG, ISR, or SSR?" (start from data freshness requirements: never changes → SSG; changes occasionally → ISR with a sensible revalidate window; must be fresh/personalized every request → SSR via cookies/no-store)
- "How would you reduce the client-side JS bundle of a large Next.js app?" (push `"use client"` boundaries as far down the tree as possible, dynamic-import heavy/rarely-used components, audit with the bundle analyzer)
- "How would you handle authentication across both Server and Client Components?" (verify session server-side via cookies in Server Components/Middleware for protected routes; use a session hook like NextAuth's `useSession` only where a Client Component needs reactive access to auth state)
- "Describe a caching bug you've hit with Next.js's fetch caching, and how you diagnosed/fixed it." (be ready with a concrete example — stale data after a mutation is the classic case, fixed with `revalidatePath`/`revalidateTag`)
- "How would you structure a large app's route groups and layouts?" (separate public/marketing vs authenticated/app sections into different route groups with different root-level concerns, nest layouts to share section-specific UI like a dashboard sidebar)

## Tips for the Interview

- When asked about rendering strategies, always tie the answer back to a concrete tradeoff (freshness vs server load vs latency) rather than just naming SSR/SSG/ISR abstractly.
- For Server vs Client Component questions, be ready to explain WHY a boundary is needed (hooks, event handlers, browser APIs) rather than just reciting the rule — interviewers often follow up with "what if this component only sometimes needs interactivity?"
- If asked to design a data-fetching flow, mention parallel fetching explicitly — accidentally sequential fetches are one of the most common real-world Next.js performance bugs.
- Be ready to discuss a real Vercel-vs-self-hosted tradeoff if asked about deployment — interviewers are often probing for practical judgment about infrastructure, not just framework trivia.
