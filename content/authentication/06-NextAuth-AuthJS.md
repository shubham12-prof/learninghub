# 06. NextAuth / Auth.js

## What is Auth.js (formerly NextAuth.js)?

Auth.js is an open-source authentication library originally built for Next.js (as "NextAuth.js") and now expanded to support other frameworks (SvelteKit, Express-adjacent setups) under the unified "Auth.js" name. It abstracts away the boilerplate of OAuth flows, session management, JWT handling, and database adapters, providing a plug-and-play authentication layer.

> Note: Auth.js is primarily designed for Next.js/full-stack JS frameworks rather than a standalone Express app — but understanding it is essential since it's the most common auth solution in modern JS full-stack projects, and many teams pair a Next.js frontend (using Auth.js) with an Express-based API backend.

## Why Use It Instead of Rolling Your Own OAuth?

- Built-in support for 50+ OAuth providers (Google, GitHub, Facebook, Discord, etc.) with minimal config.
- Handles CSRF protection, secure cookies, and session/JWT management out of the box.
- Supports both **database sessions** and **JWT sessions**.
- Pluggable **adapters** for persisting users/sessions (Prisma, MongoDB, DynamoDB, etc.).
- Supports credentials-based (email/password) login alongside OAuth providers.

## Basic Setup (Next.js App Router)

```bash
npm install next-auth
```

`app/api/auth/[...nextauth]/route.js`:

```js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt", // or 'database'
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
```

This single file automatically creates all necessary routes: `/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/signout`, `/api/auth/session`, etc.

## Adding a Credentials Provider (Email/Password)

```js
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    });
    if (!user) return null;

    const isValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash,
    );
    if (!isValid) return null;

    return { id: user.id, email: user.email, name: user.name };
  },
});
```

## Using a Database Adapter (Persisting Users/Sessions)

```bash
npm install @auth/prisma-adapter @prisma/client
```

```js
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    /* ... */
  ],
  session: { strategy: "database" }, // sessions stored in the DB instead of JWT
});
```

## Client-Side Usage (React)

```jsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return <button onClick={() => signIn("google")}>Sign in with Google</button>;
}
```

Wrapping the app with the session provider:

```jsx
// app/providers.jsx
"use client";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## Protecting Server-Side Routes/Pages

```js
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return <div>Welcome, {session.user.name}</div>;
}
```

## Middleware-Based Route Protection

```js
// middleware.js
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"], // protect these routes
};
```

## Callbacks — Customizing Tokens and Sessions

```js
export default NextAuth({
  providers: [
    /* ... */
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role; // attach custom data on sign-in
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role; // expose it to the client session object
      return session;
    },
  },
});
```

## Auth.js vs Rolling Your Own (with Passport.js/Express)

|                    | Auth.js                                     | Custom (Passport.js + Express)                             |
| ------------------ | ------------------------------------------- | ---------------------------------------------------------- |
| Setup speed        | Fast — mostly config                        | Slower — write each strategy/route manually                |
| Flexibility        | High, but framework-coupled (Next.js-first) | Full control, framework-agnostic                           |
| Best fit           | Full-stack Next.js apps                     | Standalone Express APIs, microservices, non-Next.js stacks |
| Session strategies | JWT or database, built-in                   | You implement/wire up manually                             |

## Using Auth.js Sessions with a Separate Express API

A common architecture: Next.js frontend uses Auth.js for login/session; a separate Express API validates the JWT Auth.js issues.

```js
// Express side — verify a JWT issued by Auth.js (using the shared secret)
const { getToken } = require("next-auth/jwt"); // works outside Next.js too, via raw JWT verification

function authenticate(req, res, next) {
  const token = req.cookies["next-auth.session-token"]; // or Authorization header if configured
  // verify against NEXTAUTH_SECRET using the same JWT decoding logic
  next();
}
```

In practice, many teams instead have Auth.js issue a token the Express API can verify with plain `jsonwebtoken` using a shared secret, keeping the two systems loosely coupled.

## Common Interview-Style Questions

- **What problem does Auth.js/NextAuth solve?**
  It abstracts away the repetitive boilerplate of implementing OAuth flows, session/JWT management, and CSRF protection, providing pre-built provider integrations and session strategies for full-stack JS apps.

- **What are the two session strategies Auth.js supports, and how do they differ?**
  `jwt` (stateless — session data encoded in a signed token) and `database` (stateful — session stored server-side via an adapter, referenced by a session ID).

- **How do you add a custom email/password login alongside OAuth providers in Auth.js?**
  Use the `CredentialsProvider`, implementing an `authorize()` function that validates credentials against your own database (typically with bcrypt password comparison).

- **How would you protect a page/route so only authenticated users can access it?**
  Check `getServerSession()` on the server (redirecting if absent), and/or use Auth.js's built-in middleware with a `matcher` config to guard specific route patterns.
