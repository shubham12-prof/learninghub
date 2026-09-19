# NextAuth

NextAuth.js (now branded **Auth.js** for its framework-agnostic version) is a complete authentication library for Next.js — handles OAuth providers (Google, GitHub, etc.), session management, JWTs, and database adapters, so you don't have to hand-roll the flow described in the Authentication file.

```ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await verifyUserCredentials(credentials);
        return user ?? null; // returning null rejects the sign-in attempt
      },
    }),
  ],
  session: { strategy: "jwt" }, // or "database" if using an adapter
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub!; // attach extra data to the session object
      return session;
    },
  },
});

export { handler as GET, handler as POST }; // one file handles the entire auth API surface
```

**Using the session in a Server Component:**

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <h1>Welcome, {session.user.name}</h1>;
}
```

**Using the session in a Client Component (requires wrapping the app in a `SessionProvider`):**

```tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

function AuthButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>Loading...</p>;
  return session ? (
    <button onClick={() => signOut()}>Sign out, {session.user?.name}</button>
  ) : (
    <button onClick={() => signIn()}>Sign in</button>
  );
}
```

**Why use NextAuth instead of building auth from scratch:** built-in support for dozens of OAuth providers (avoiding the need to implement each provider's OAuth handshake yourself), secure session handling out of the box, CSRF protection, and pluggable database adapters (Prisma, MongoDB, etc.) for persisting sessions/users.

**Interview note:** NextAuth supports two session strategies — `"jwt"` (session data encoded directly in a signed cookie, no database lookup needed per request, but harder to invalidate early) and `"database"` (session stored server-side, looked up per request via an adapter, easier to revoke instantly) — a common interview question is explaining this tradeoff.
