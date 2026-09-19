# Nested Routes

Routes composed of multiple nested folder segments, where each level can have its own layout, loading state, and error boundary — the folder hierarchy directly maps to URL hierarchy AND to nested UI composition.

```
app/
├── layout.tsx                  # wraps EVERYTHING
├── dashboard/
│   ├── layout.tsx                  # wraps all /dashboard/* routes
│   ├── page.tsx                       # "/dashboard"
│   ├── settings/
│   │   └── page.tsx                      # "/dashboard/settings"
│   └── analytics/
│       └── page.tsx                         # "/dashboard/analytics"
```

**UI nesting mirrors the folder nesting** — visiting `/dashboard/settings` renders:

```
RootLayout
  └── DashboardLayout
        └── SettingsPage
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Sidebar />
      <main>{children}</main>{" "}
      {/* children = whichever nested page/layout matched */}
    </div>
  );
}
```

**Each nested segment can independently define `loading.tsx`/`error.tsx`**, so a slow-loading `/dashboard/analytics` page only shows a loading state for ITSELF, while the surrounding `DashboardLayout` (sidebar, etc.) stays rendered and interactive.

**Interview note:** this nested structure is what enables Next.js's fine-grained loading/error boundaries and partial rendering — unlike a single top-level route config, each segment in the URL can independently be "loading," "errored," or "ready," and the framework composes them automatically based on folder structure.
