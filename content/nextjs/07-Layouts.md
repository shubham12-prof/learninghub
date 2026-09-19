# Layouts

UI that's shared across multiple pages and **preserves state, stays mounted, and doesn't re-render** when navigating between child pages within it — defined via `layout.tsx` files.

```tsx
// app/layout.tsx — the ROOT layout, required, wraps the entire app
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children} {/* the matched page or nested layout renders here */}
        <Footer />
      </body>
    </html>
  );
}
```

```tsx
// app/dashboard/layout.tsx — nested layout, only wraps /dashboard/* routes
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

**Layouts persist across navigation within their scope** — navigating from `/dashboard/settings` to `/dashboard/analytics` re-renders only the page content, NOT `DashboardLayout` (so sidebar scroll position, open dropdowns, etc. stay intact).

**Layouts can fetch their own data (as Server Components), independent of the pages inside them:**

```tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(); // fetched once, available to the whole dashboard section
  return (
    <div>
      <Sidebar user={user} />
      {children}
    </div>
  );
}
```

**Key constraint:** layouts do NOT receive `params` for dynamic segments below them by default in the same way pages do, and they can't access `useSearchParams` directly if they're Server Components (search params require either a Client Component or being read in the page itself).

**Interview note:** the defining behavior that separates a Layout from a Template (see that file) is that a Layout **preserves component state and doesn't remount** across navigations within its scope — this is what makes persistent UI like a sidebar's scroll position or an open mobile nav menu survive page transitions.
