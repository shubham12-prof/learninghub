# Authentication

Verifying a user's identity in a Next.js app — can be implemented from scratch (sessions/JWTs + cookies) or via a library like NextAuth.js/Auth.js (see that file).

**Core building blocks of a hand-rolled auth flow:**

```ts
// app/api/login/route.ts — verify credentials, issue a session
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", token, {
    httpOnly: true, // inaccessible to client-side JS — prevents XSS token theft
    secure: true, // HTTPS only
    sameSite: "strict", // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
```

**Protecting routes — checking auth in Middleware (centralized, runs before rendering):**

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
```

**Reading the current user in a Server Component:**

```tsx
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default async function DashboardPage() {
  const token = cookies().get("session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) redirect("/login"); // from next/navigation
  return <h1>Welcome, {user.name}</h1>;
}
```

**Key security practices:** always hash passwords (bcrypt/argon2, never plaintext), use `httpOnly` + `secure` + `sameSite` cookies for session tokens (not `localStorage`, which is readable by any JS on the page and vulnerable to XSS), and validate the session on the server for every protected route — never trust client-side-only checks.

**Interview note:** "Why store the session token in an httpOnly cookie instead of localStorage?" — `httpOnly` cookies are inaccessible to JavaScript entirely, meaning a Cross-Site Scripting (XSS) vulnerability elsewhere in the app can't be used to steal the token, whereas anything in `localStorage` is readable by any script running on the page, including injected malicious ones.
