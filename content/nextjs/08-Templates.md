# Templates

Similar to Layouts (`layout.tsx`), Templates (`template.tsx`) wrap child pages — but unlike a Layout, a Template creates a **new instance and remounts on every navigation**, resetting component state each time.

```tsx
// app/dashboard/template.tsx
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fade-in">{children}</div>;
}
```

**Layout vs Template — the core difference:**

|                                      | Layout                         | Template                                                               |
| ------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| Remounts on navigation?              | No — persists, state preserved | Yes — fresh instance every time                                        |
| `useState`/`useEffect` reset on nav? | No                             | Yes                                                                    |
| Good for                             | persistent UI (sidebar, nav)   | per-page animations, resetting state, per-navigation analytics/effects |

**When you'd actually reach for a Template instead of a Layout:**

```tsx
// Template — useEffect re-runs on EVERY navigation, since the component remounts
"use client";
export default function AnalyticsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    trackPageView(); // fires fresh on every single navigation within this segment
  }, []);
  return <>{children}</>;
}
```

A Layout wrapping the same code would only fire `trackPageView()` once (on initial mount), NOT on every subsequent navigation within its scope — because the Layout instance persists.

**Interview note:** Templates are used far less often than Layouts in practice — reach for one specifically when you need **fresh component state per navigation** (enter/exit animations keyed to route changes, per-page effect re-runs, or resetting a form when navigating between similar dynamic routes like `/products/[id]`).
