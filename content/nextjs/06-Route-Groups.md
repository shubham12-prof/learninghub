# Route Groups

Folders wrapped in parentheses `(groupName)` that organize routes **without affecting the URL path** — used to apply different layouts to different sections of the same app, or just to organize files logically.

```
app/
├── (marketing)/
│   ├── layout.tsx          # layout only for marketing pages
│   ├── page.tsx                # "/" — the parens are NOT part of the URL
│   └── about/
│       └── page.tsx               # "/about"
├── (shop)/
│   ├── layout.tsx             # different layout for shop pages
│   ├── products/
│   │   └── page.tsx               # "/products"
│   └── cart/
│       └── page.tsx                  # "/cart"
```

Both `/` and `/about` use the `(marketing)` layout, while `/products` and `/cart` use a completely different `(shop)` layout — even though URL-wise there's no `/marketing/` or `/shop/` prefix at all.

**Common use case — a different root layout for authenticated vs public sections:**

```
app/
├── (public)/
│   ├── layout.tsx      # simple layout, marketing nav
│   ├── page.tsx
│   └── login/page.tsx
├── (authenticated)/
│   ├── layout.tsx         # dashboard shell with sidebar, auth check
│   └── dashboard/page.tsx
```

**Multiple root layouts** — route groups also let you define entirely separate root `<html>`/`<body>` layouts for different sections of the same app (e.g., a marketing site vs a dashboard app with different global styles).

**Interview note:** the key distinction from Nested Routes is that route groups are purely **organizational** — the parenthesized folder name is stripped from the URL entirely, so they let you group routes by layout/concern (marketing vs shop, public vs authenticated) without introducing an unwanted URL segment.
