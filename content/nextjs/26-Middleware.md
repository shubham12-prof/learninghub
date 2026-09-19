# Middleware

Code that runs **before a request completes**, at the edge — intercepting requests to read/modify them, redirect, rewrite, or block access, before any route rendering happens.

```ts
// middleware.ts — MUST live at the project root (or inside src/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url)); // block unauthenticated access
  }

  return NextResponse.next(); // allow the request to continue as normal
}

// Restrict which routes middleware runs on (performance — avoid running it on EVERY request)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

**Common use cases:**

```ts
// Rewriting a URL (changes what's served, WITHOUT changing the visible URL in the browser)
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/old-page") {
    return NextResponse.rewrite(new URL("/new-page", request.url));
  }
}

// A/B testing — route a percentage of users to a variant
export function middleware(request: NextRequest) {
  const bucket = Math.random() < 0.5 ? "a" : "b";
  const response = NextResponse.next();
  response.cookies.set("ab-bucket", bucket);
  return response;
}

// Adding/modifying headers on every response
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-custom-header", "value");
  return response;
}
```

**Key constraints — Middleware runs in the Edge Runtime, NOT the full Node.js runtime:**

- No direct database drivers that need Node APIs (many DB clients won't work — call an API route instead)
- No `fs` (file system) access
- Runs geographically close to the user (at the "edge"), so it executes with very low latency, before hitting your main server/region

**Interview note:** Middleware executes for EVERY matching request before any page or API route logic runs — a very common real-world use is centralizing auth/redirect logic in ONE place (rather than repeating auth checks in every protected page's Server Component), combined with the `matcher` config to scope it only to routes that actually need it, for performance.
