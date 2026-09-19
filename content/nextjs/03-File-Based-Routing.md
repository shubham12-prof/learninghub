# File Based Routing

Next.js derives your application's routes directly from the folder structure inside `app/` — no manually written route configuration file.

```
app/
├── page.tsx              # "/"
├── about/
│   └── page.tsx              # "/about"
├── contact/
│   └── page.tsx                 # "/contact"
├── blog/
│   ├── page.tsx                    # "/blog"
│   └── first-post/
│       └── page.tsx                   # "/blog/first-post"
```

**Only `page.tsx` files are publicly routable** — a folder without a `page.tsx` doesn't create a visitable URL, even if it contains other files (layouts, components, utilities). This lets you colocate non-route files (like components) inside route folders without accidentally exposing them as pages.

```
app/
├── blog/
│   ├── page.tsx           # "/blog" — routable
│   ├── PostCard.tsx           # NOT routable — just a component, colocated here for convenience
│   └── utils.ts                  # NOT routable — helper functions
```

**Private folders** (prefixed with `_`) are explicitly excluded from routing, useful for colocating implementation details:

```
app/
├── _components/           # never routed, purely organizational
│   └── Header.tsx
├── page.tsx
```

**Interview note:** file-based routing removes an entire category of manual configuration (React Router's `<Route path="..." element={...} />` declarations) at the cost of coupling your URL structure directly to your folder structure — a tradeoff most teams find worthwhile for the reduced boilerplate and colocated route-specific files (loading/error/layout).
