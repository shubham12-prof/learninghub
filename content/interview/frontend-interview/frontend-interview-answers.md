# Frontend Development: Questions & Answers

## Table of Contents

1. [HTML / CSS / JavaScript](#section-1)
2. [JavaScript Frameworks / Libraries](#section-2)
3. [Web Performance / Optimisation](#section-3)
4. [Accessibility / UX / Responsive Design](#section-4)
5. [Deployment / Tooling / Collaboration](#section-5)

---

<a id="section-1"></a>

# 1. HTML / CSS / JavaScript

## 1.1 Responsive navigation bar that collapses into a hamburger menu

**HTML**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Responsive Navbar</title>
    <link rel="stylesheet" href="navbar.css" />
  </head>
  <body>
    <header class="navbar">
      <a href="/" class="logo">MySite</a>

      <button
        class="hamburger"
        aria-label="Toggle navigation menu"
        aria-expanded="false"
        aria-controls="nav-menu"
      >
        <span></span><span></span><span></span>
      </button>

      <nav id="nav-menu" class="nav-menu" aria-label="Main">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>

    <script src="navbar.js"></script>
  </body>
</html>
```

**CSS (mobile-first)**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: #1f2937;
  color: #fff;
}

.logo {
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
}

/* Hamburger button */
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0.5rem;
}
.hamburger span {
  width: 26px;
  height: 3px;
  background: #fff;
  border-radius: 2px;
  transition:
    transform 0.3s,
    opacity 0.3s;
}
/* Animate into an "X" */
.hamburger[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}
.hamburger[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Mobile menu: hidden by default */
.nav-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #111827;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.nav-menu.open {
  max-height: 300px;
}
.nav-menu ul {
  list-style: none;
}
.nav-menu a {
  display: block;
  padding: 1rem 1.25rem;
  color: #fff;
  text-decoration: none;
  border-top: 1px solid #374151;
}
.nav-menu a:hover,
.nav-menu a:focus-visible {
  background: #374151;
}

/* Desktop: inline links, hide hamburger */
@media (min-width: 768px) {
  .hamburger {
    display: none;
  }
  .nav-menu {
    position: static;
    max-height: none;
    overflow: visible;
    background: transparent;
  }
  .nav-menu ul {
    display: flex;
    gap: 0.5rem;
  }
  .nav-menu a {
    border-top: 0;
    border-radius: 6px;
    padding: 0.5rem 0.9rem;
  }
}
```

**JavaScript**

```js
const btn = document.querySelector(".hamburger");
const menu = document.getElementById("nav-menu");

btn.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", String(isOpen));
});

// Close with the Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("open")) {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }
});
```

**Key points:** mobile-first CSS, a real `<button>` (keyboard-focusable by default), `aria-expanded` kept in sync with state, and a single breakpoint at `768px`.

---

## 1.2 Semantic vs non-semantic HTML

**Semantic tags** describe the _meaning_ of their content: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<time>`, `<button>`, `<h1>`–`<h6>`.

**Non-semantic tags** say nothing about their content: `<div>` and `<span>`.

```html
<!-- Non-semantic -->
<div class="header">
  <div class="nav">...</div>
</div>
<div class="main">
  <div class="post">...</div>
</div>

<!-- Semantic -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
</main>
```

### Why semantics matter for accessibility

- **Landmarks:** Screen readers expose `<nav>`, `<main>`, `<header>`, `<footer>` as landmarks, so users can jump straight to the main content or navigation.
- **Heading structure:** Assistive-tech users navigate by headings (`h1`→`h2`→`h3`); a `<div class="title">` gives them nothing.
- **Built-in behaviour:** `<button>` is focusable, activates with Enter/Space and announces its role. A `<div onclick>` needs `tabindex`, key handlers and `role="button"` to match it.
- **Forms:** `<label for>` links text to inputs, so screen readers announce it and clicking the label focuses the field.
- **Less ARIA needed:** The first rule of ARIA is "don't use ARIA if a native element does the job".

### Why semantics matter for SEO

- Search engines use elements like `<h1>`, `<article>`, `<nav>`, and `<time>` to understand structure and importance of content.
- Clear heading hierarchy helps crawlers work out topics and can influence featured snippets.
- Semantic markup pairs well with structured data (JSON-LD / schema.org).
- Accessible, well-structured pages tend to have better engagement and usability signals.

**Rule of thumb:** use `<div>`/`<span>` only when no semantic element fits (e.g., purely for styling or layout hooks).

---

## 1.3 Tabbed interface in vanilla JavaScript

```html
<div class="tabs">
  <div class="tab-list" role="tablist" aria-label="Product info">
    <button
      role="tab"
      id="tab-1"
      aria-controls="panel-1"
      aria-selected="true"
      tabindex="0"
    >
      Description
    </button>
    <button
      role="tab"
      id="tab-2"
      aria-controls="panel-2"
      aria-selected="false"
      tabindex="-1"
    >
      Specs
    </button>
    <button
      role="tab"
      id="tab-3"
      aria-controls="panel-3"
      aria-selected="false"
      tabindex="-1"
    >
      Reviews
    </button>
  </div>

  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
    <p>Description content…</p>
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
    <p>Specs content…</p>
  </div>
  <div role="tabpanel" id="panel-3" aria-labelledby="tab-3" hidden>
    <p>Reviews content…</p>
  </div>
</div>
```

```css
.tab-list {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  gap: 4px;
}
.tab-list button {
  padding: 0.6rem 1.1rem;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  border-bottom: 3px solid transparent;
}
.tab-list button[aria-selected="true"] {
  border-bottom-color: #2563eb;
  color: #2563eb;
  font-weight: 600;
}
[role="tabpanel"] {
  padding: 1rem 0;
}
```

```js
const tablist = document.querySelector('[role="tablist"]');
const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function activateTab(newTab) {
  tabs.forEach((tab) => {
    const selected = tab === newTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.id !== newTab.getAttribute("aria-controls");
  });
  newTab.focus();
}

// Click
tabs.forEach((tab) => tab.addEventListener("click", () => activateTab(tab)));

// Keyboard: arrow keys, Home, End
tablist.addEventListener("keydown", (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i === -1) return;
  let next;
  if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
  else if (e.key === "ArrowLeft")
    next = tabs[(i - 1 + tabs.length) % tabs.length];
  else if (e.key === "Home") next = tabs[0];
  else if (e.key === "End") next = tabs[tabs.length - 1];
  if (next) {
    e.preventDefault();
    activateTab(next);
  }
});
```

This follows the WAI-ARIA Tabs pattern: only the active tab is in the tab order, arrow keys move between tabs, and panels are linked to tabs via `aria-controls` / `aria-labelledby`.

---

<a id="section-2"></a>

# 2. JavaScript Frameworks / Libraries

## 2.1 React vs Vue vs Angular

| Aspect             | **React**                                     | **Vue.js**                                  | **Angular**                           |
| ------------------ | --------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| Type               | UI library                                    | Progressive framework                       | Full framework                        |
| Language           | JS/TS + JSX                                   | JS/TS + SFC templates                       | TypeScript (required)                 |
| Learning curve     | Moderate (hooks, ecosystem choices)           | Gentle                                      | Steep (DI, RxJS, modules/signals)     |
| Data binding       | One-way                                       | One-way + `v-model` two-way                 | Two-way & signals                     |
| Batteries included | No: choose router, state, forms               | Official router (Vue Router), store (Pinia) | Yes: router, forms, HTTP, DI, testing |
| Ecosystem / jobs   | Largest                                       | Large, strong in Asia/Europe                | Strong in enterprise                  |
| Performance        | Excellent (Virtual DOM, concurrent rendering) | Excellent (fine-grained reactivity)         | Good; improving with signals          |
| Flexibility        | Very high                                     | High                                        | Opinionated                           |
| Meta-framework     | Next.js, Remix                                | Nuxt                                        | Angular Universal / SSR built in      |

### React

- **Pros:** huge ecosystem and talent pool, flexible, great for large and complex UIs, React Native for mobile, strong meta-frameworks (Next.js).
- **Cons:** you assemble the stack yourself (decision fatigue), hooks have pitfalls (stale closures, dependency arrays), ecosystem churn.

### Vue.js

- **Pros:** easiest to learn, clear single-file components, excellent docs, fine-grained reactivity, official tooling is cohesive.
- **Cons:** smaller job market than React, fewer large enterprise case studies, community plugins vary in quality.

### Angular

- **Pros:** everything included, strong conventions (great for large teams), TypeScript-first, built-in DI and testing utilities.
- **Cons:** steep learning curve, more boilerplate, heavier bundles for small apps, less flexible.

### Recommendation

- **Startup / MVP / hiring flexibility:** React (with Next.js) or Vue (with Nuxt).
- **Small team wanting fast onboarding:** Vue.
- **Large enterprise with many teams needing strict structure:** Angular.
- Team experience and hiring market usually matter more than raw technical differences.

---

## 2.2 Managing state in a large frontend app

**Start by classifying state:**

| State type              | Examples                | Best tool                                    |
| ----------------------- | ----------------------- | -------------------------------------------- |
| **Local UI state**      | Modal open, input value | `useState` / `ref`                           |
| **Shared client state** | Auth user, theme, cart  | Context, Redux Toolkit, Zustand, Pinia/Vuex  |
| **Server state**        | API data, caching       | React Query / TanStack Query, SWR, RTK Query |
| **URL state**           | Filters, pagination     | Router / query params                        |
| **Form state**          | Complex forms           | React Hook Form, Formik                      |

**Principles:** keep state as local as possible, avoid duplicating server data in global stores, keep the store normalised, and derive values via selectors instead of storing them.

### Option A: React Context (simple, low-frequency global state)

```jsx
import { createContext, useContext, useReducer } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return { ...state, items: [...state.items, action.item] };
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
```

> **Caveat:** every consumer re-renders when the context value changes. Split contexts or use a store with selectors for frequently updating data.

### Option B: Redux Toolkit (large apps, predictable updates, devtools)

```js
// store/cartSlice.js
import { createSlice, configureStore } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload);
    }, // Immer allows "mutation"
    removeItem: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
});

export const { addItem, removeItem } = cartSlice.actions;
export const selectCartCount = (state) => state.cart.items.length;

export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
```

```jsx
// Component usage
import { Provider, useSelector, useDispatch } from "react-redux";

function CartBadge() {
  const count = useSelector(selectCartCount); // re-renders only if count changes
  return <span>{count}</span>;
}

function AddButton({ product }) {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(addItem(product))}>Add</button>;
}
```

### Option C: Vue with Pinia (the modern replacement for Vuex)

```js
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({ items: [] }),
  getters: { count: (s) => s.items.length },
  actions: {
    add(item) {
      this.items.push(item);
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
    },
  },
});
```

**When to choose what:** Context for small/rarely-changing state; Redux Toolkit (or Zustand) for complex client state with many actors; TanStack Query for anything that comes from the server.

---

## 2.3 React component: fetch from REST API with loading + error states

```jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Memoised list item: skips re-render if props are unchanged
const UserCard = memo(function UserCard({ user }) {
  return (
    <li className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </li>
  );
});

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const fetchUsers = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_URL, { signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setUsers(await res.json());
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message); // ignore cancellations
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort(); // cleanup on unmount, avoids memory leaks and race conditions
  }, [fetchUsers]);

  // Derived data: only recomputed when users/query change
  const filtered = useMemo(
    () =>
      users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())),
    [users, query],
  );

  if (loading)
    return (
      <p role="status" aria-live="polite">
        Loading users…
      </p>
    );

  if (error) {
    return (
      <div role="alert">
        <p>Something went wrong: {error}</p>
        <button onClick={() => fetchUsers(new AbortController().signal)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section>
      <label>
        Search:{" "}
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {filtered.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </ul>
      )}
    </section>
  );
}
```

### How I'd optimise it

1. **Cancel requests** with `AbortController` to avoid race conditions and state updates after unmount (shown above).
2. **Use TanStack Query (or SWR)** in production: it provides caching, request de-duplication, background refetching, retries and stale-while-revalidate for free.
   ```jsx
   const { data, isLoading, error } = useQuery({
     queryKey: ["users"],
     queryFn: fetchUsers,
     staleTime: 60_000,
   });
   ```
3. **Memoise** expensive derived data (`useMemo`) and list items (`memo`); keep stable callbacks (`useCallback`).
4. **Debounce** the search input (or filter server-side) for big datasets.
5. **Virtualise** long lists (`react-window`, `@tanstack/react-virtual`) so only visible rows render.
6. **Paginate / infinite scroll** rather than fetching everything.
7. **Stable `key`s** (ids, never array indexes for dynamic lists).
8. **Skeleton loaders** to improve perceived performance and reduce layout shift.
9. **HTTP-level:** enable compression, ETag/Cache-Control headers, and request only the fields you need.

---

<a id="section-3"></a>

# 3. Web Performance / Optimisation

## 3.1 Techniques to improve load time and render performance

### Reduce what is sent

- **Minification & compression:** minify JS/CSS/HTML; serve with Brotli (or gzip).
- **Tree-shaking & dead-code removal:** use ES modules and avoid importing whole libraries (`import debounce from 'lodash/debounce'`).
- **Audit dependencies:** use bundle analysers (`webpack-bundle-analyzer`, `vite-bundle-visualizer`) and replace heavy libs (e.g., moment.js → date-fns / Day.js).

### Load only what is needed

- **Code-splitting:** split by route and heavy components.

  ```jsx
  import { lazy, Suspense } from "react";
  const Dashboard = lazy(() => import("./Dashboard"));

  <Suspense fallback={<Spinner />}>
    <Dashboard />
  </Suspense>;
  ```

- **Lazy-loading:** images/iframes below the fold (`loading="lazy"`), plus components loaded on interaction or visibility (`IntersectionObserver`).
- **Prefetch / preload:** `<link rel="preload">` for critical assets (fonts, hero image), `<link rel="prefetch">` for likely next routes, `preconnect` to third-party origins.

### Images and media

- Use modern formats (**WebP / AVIF**), responsive images with `srcset` and `sizes`, correct dimensions, and an image CDN.
- Always set `width` and `height` (or `aspect-ratio`) to prevent layout shift.
- Use SVG for icons and compress video; avoid autoplaying large videos.
  ```html
  <img
    src="hero-800.webp"
    srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
    sizes="(max-width: 600px) 100vw, 50vw"
    width="800"
    height="450"
    alt="Hero"
    fetchpriority="high"
  />
  ```

### Fonts

- Self-host, subset, use WOFF2, add `font-display: swap`, and preload the critical font.

### Caching

- **Static assets:** content-hashed filenames + `Cache-Control: public, max-age=31536000, immutable`.
- **HTML:** short cache or `no-cache` with revalidation (ETag).
- **CDN** for edge caching, **Service Worker** (Workbox) for offline and runtime caching.
- **API data:** client caching with React Query/SWR; HTTP caching headers server-side.

### Rendering strategy

- Choose SSR, SSG or ISR (Next.js/Nuxt) for content-heavy pages to speed up FCP/LCP and help SEO; hydrate progressively / use islands where possible.

### Runtime and render performance

- Avoid layout thrashing (batch DOM reads then writes); animate with `transform`/`opacity` (GPU-friendly) instead of `top/left/width`.
- Use `requestAnimationFrame`, debounce/throttle scroll and resize handlers, and passive event listeners.
- Move heavy computations to **Web Workers**; break long tasks (>50 ms) into chunks.
- Use `content-visibility: auto` for long off-screen sections.
- In React: `memo`, `useMemo`, `useCallback`, list virtualisation, avoid unnecessary context updates.
- Use **HTTP/2 or HTTP/3** for multiplexing; reduce third-party scripts and load them with `async` / `defer`.

---

## 3.2 The Critical Rendering Path (CRP)

**Definition:** the sequence of steps the browser takes to convert HTML, CSS and JavaScript into pixels on the screen.

```
HTML  ──► DOM ─────────┐
                        ├─► Render Tree ─► Layout ─► Paint ─► Composite
CSS   ──► CSSOM ───────┘
JS can block/alter both DOM and CSSOM
```

1. **Parse HTML → DOM** (Document Object Model).
2. **Parse CSS → CSSOM.** CSS is _render-blocking_: the browser will not paint until it has the CSSOM.
3. **JavaScript:** a plain `<script>` is _parser-blocking_ (halts DOM construction and waits for pending CSS).
4. **Render tree:** combine DOM + CSSOM (visible nodes only).
5. **Layout (reflow):** compute size and position of each element.
6. **Paint:** draw pixels into layers.
7. **Composite:** combine layers on the GPU.

### Why an SPA is a special problem

A typical client-rendered SPA ships a nearly empty HTML shell, so the browser must download → parse → execute a large JS bundle → fetch data → render. The user sees a blank screen until all that finishes.

### How I'd optimise it in an SPA

1. **Shorten the critical path (fewer round-trips):** reduce the number of critical resources, their size and dependency chain length. Use HTTP/2/3 and a CDN.
2. **Inline critical CSS** for above-the-fold content; load the rest asynchronously
   ```html
   <style>
     /* critical CSS */
   </style>
   <link
     rel="preload"
     href="main.css"
     as="style"
     onload="this.rel='stylesheet'"
   />
   ```
3. **Don't block on JS:** use `defer` (preserves order, runs after parsing) or `async` for independent scripts; use `type="module"`.
4. **Code-split** so the first route ships only the JS it needs; lazy-load the rest.
5. **SSR / SSG / streaming** so meaningful HTML arrives immediately, then hydrate (selective/progressive hydration).
6. **Preload key resources** (LCP image, fonts) and `preconnect` to API/CDN origins; use `fetchpriority="high"` for the LCP image.
7. **Reduce CSS/JS size:** purge unused CSS, minify, tree-shake, compress with Brotli.
8. **Avoid layout shifts and heavy reflows:** reserve space for images/ads, avoid inserting content above existing content.
9. **Fetch data early:** start API requests in parallel with code loading (route-level data loaders, prefetch on hover) instead of waterfalling.
10. **App shell + Service Worker** for repeat visits.

---

## 3.3 Measuring frontend performance and acting on findings

### Metrics

| Metric                              | What it measures                                  | Good target |
| ----------------------------------- | ------------------------------------------------- | ----------- |
| **LCP** (Largest Contentful Paint)  | Loading: when the main content appears            | ≤ 2.5 s     |
| **INP** (Interaction to Next Paint) | Responsiveness (replaced FID as a Core Web Vital) | ≤ 200 ms    |
| **CLS** (Cumulative Layout Shift)   | Visual stability                                  | ≤ 0.1       |
| **FCP** (First Contentful Paint)    | First text/image painted                          | ≤ 1.8 s     |
| **TTFB** (Time To First Byte)       | Server/network responsiveness                     | ≤ 0.8 s     |
| **TTI** (Time To Interactive)       | When the page is reliably interactive (legacy)    | < 3.8 s     |
| **TBT** (Total Blocking Time)       | Main-thread blocking; lab proxy for INP           | ≤ 200 ms    |

### Tooling

- **Lab (synthetic):** Lighthouse, Chrome DevTools (Performance, Network, Coverage tabs), WebPageTest.
- **Field (real users, RUM):** Chrome UX Report (CrUX), PageSpeed Insights, `web-vitals` library, and RUM tools like Sentry, Datadog, New Relic, SpeedCurve.
- **Bundle analysis:** webpack-bundle-analyzer, source-map-explorer, `size-limit`.
- **React-specific:** React DevTools Profiler.
- **In CI:** Lighthouse CI with **performance budgets** that fail the build on regressions.

```js
import { onLCP, onINP, onCLS } from "web-vitals";
const send = (metric) =>
  navigator.sendBeacon("/analytics", JSON.stringify(metric));
onLCP(send);
onINP(send);
onCLS(send);
```

### Process after measuring

1. **Establish a baseline** on real devices/throttled networks (e.g., mid-range mobile, 4G) and in the field (p75).
2. **Identify the bottleneck** using the waterfall and flame charts.
3. **Map symptom → fix:**

| Finding      | Typical fix                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| Slow LCP     | Optimise/preload hero image, inline critical CSS, SSR, CDN, reduce TTFB                     |
| High TBT/INP | Split long tasks, code-split, defer third-party scripts, Web Workers, memoisation           |
| High CLS     | Set image/video dimensions, reserve space, avoid late-injected content, font-display tuning |
| Large bundle | Tree-shake, lazy-load, replace heavy dependencies                                           |
| Slow TTFB    | Caching, CDN, SSR/edge optimisation, backend query tuning                                   |

4. **Fix one thing at a time, re-measure** and confirm improvement.
5. **Prevent regressions:** performance budgets in CI, monitoring dashboards and alerts.
6. **Prioritise by impact:** focus on pages with the most traffic or conversion value.

---

<a id="section-4"></a>

# 4. Accessibility / UX / Responsive Design

## 4.1 Ensuring the web app meets accessibility standards

**Target standard:** WCAG 2.2 Level AA (POUR principles: Perceivable, Operable, Understandable, Robust), plus local legal requirements (ADA, EN 301 549, etc.).

### 1. Start with semantic HTML

Use native elements (`<button>`, `<a>`, `<label>`, `<nav>`, `<main>`, headings in logical order). Native elements provide keyboard and screen-reader support automatically.

### 2. ARIA, only where needed

- Use ARIA to fill gaps for custom widgets: `role`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-expanded`, `aria-controls`, `aria-live`, `aria-current`.
- Keep ARIA state in sync with UI state.
- Wrong ARIA is worse than no ARIA.
  ```html
  <button aria-expanded="false" aria-controls="details">Show details</button>
  <div id="details" hidden>…</div>
  <div role="status" aria-live="polite">3 results found</div>
  ```

### 3. Keyboard navigation

- Everything interactive must be reachable and operable by keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys, Esc).
- **Visible focus indicator** (never `outline: none` without a replacement), using `:focus-visible`.
- Logical tab order (follow DOM order; avoid positive `tabindex`).
- **Focus management:** move focus into modals, trap it inside, return it on close; move focus on route changes in SPAs.
- Provide a **"Skip to main content"** link.
- Use **roving tabindex** for composite widgets (tabs, menus, toolbars).

### 4. Screen-reader support

- Meaningful `alt` text (empty `alt=""` for decorative images).
- Associate every form control with a `<label>`; announce errors with `aria-describedby` / `role="alert"`.
- Announce dynamic updates via live regions.
- Use descriptive link text (not "click here").
- Set `lang` on `<html>` and on foreign-language passages.
- Provide captions/transcripts for audio and video.

### 5. Visual design

- Colour contrast: 4.5:1 for normal text, 3:1 for large text and UI components.
- Never rely on colour alone to convey information.
- Support zoom to 200% and text resizing (use `rem`), reflow at 320px width.
- Respect user preferences: `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`.
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
  ```
- Touch targets ≥ 24×24 px (WCAG 2.2), ideally 44×44 px.

### 6. Testing (automated + manual)

| Layer                     | Tools / approach                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Linting                   | `eslint-plugin-jsx-a11y`                                                            |
| Automated audits          | axe DevTools, Lighthouse, Pa11y, `jest-axe`, `cypress-axe` / Playwright + axe in CI |
| Keyboard-only walkthrough | Unplug the mouse and complete key flows                                             |
| Screen readers            | NVDA / JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)                    |
| Manual checks             | Zoom, high-contrast mode, colour-blindness simulators                               |
| Real users                | Usability testing with people with disabilities                                     |

> Automated tools catch only ~30–40% of issues, so manual testing is essential.

### 7. Process

- Include accessibility in the **Definition of Done** and design reviews (annotated designs).
- Use an accessible component library (Radix UI, React Aria, Headless UI) as a base.
- Maintain an accessibility statement and a backlog for known issues.

---

## 4.2 Responsive design for mobile, tablet and desktop

### Approach

1. **Mobile-first:** write base styles for small screens, enhance with `min-width` media queries.
2. **Fluid layouts:** relative units (`%`, `rem`, `vw`, `fr`), `clamp()` for fluid type and spacing.
3. **Content-driven breakpoints** (e.g., ~640 / 768 / 1024 / 1280 px) instead of specific devices.
4. **Modern layout tools:** CSS Grid for two-dimensional layout, Flexbox for one-dimensional alignment.
5. **Responsive media:** `srcset`/`sizes`, `<picture>`, `max-width: 100%`.
6. **Viewport meta tag:** `<meta name="viewport" content="width=device-width, initial-scale=1">`.
7. Consider **container queries** for component-level responsiveness.

### Example: card grid + page layout

```html
<div class="page">
  <header class="page-header">Header</header>
  <nav class="page-nav">Nav</nav>
  <main class="page-main">
    <div class="cards">
      <article class="card">1</article>
      <article class="card">2</article>
      <article class="card">3</article>
      <article class="card">4</article>
    </div>
  </main>
  <aside class="page-aside">Aside</aside>
  <footer class="page-footer">Footer</footer>
</div>
```

```css
:root {
  --gap: clamp(0.75rem, 2vw, 1.5rem);
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); /* fluid typography */
}

/* Mobile-first: single column */
.page {
  display: grid;
  gap: var(--gap);
  grid-template-areas:
    "header"
    "nav"
    "main"
    "aside"
    "footer";
}
.page-header {
  grid-area: header;
}
.page-nav {
  grid-area: nav;
}
.page-main {
  grid-area: main;
}
.page-aside {
  grid-area: aside;
}
.page-footer {
  grid-area: footer;
}

/* Auto-responsive cards: no media query needed */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--gap);
}
.card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

/* Tablet: sidebar appears */
@media (min-width: 768px) {
  .page {
    grid-template-columns: 200px 1fr;
    grid-template-areas:
      "header header"
      "nav    main"
      "aside  aside"
      "footer footer";
  }
}

/* Desktop: three columns */
@media (min-width: 1100px) {
  .page {
    grid-template-columns: 220px minmax(0, 1fr) 260px;
    grid-template-areas:
      "header header header"
      "nav    main   aside"
      "footer footer footer";
  }
}

/* Flexbox example: toolbar that wraps */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}
.toolbar > * {
  flex: 1 1 120px;
}
```

### What I'd check

- **Devices & viewports:** Chrome DevTools device mode, real devices (iOS Safari, Android Chrome), BrowserStack/Playwright across browsers.
- **No horizontal scroll** at any width from 320px up; test in both portrait and landscape.
- **Touch:** target sizes ≥ 44px, no hover-only interactions, adequate spacing.
- **Typography:** readable line-length (45–75 characters), zoom to 200%.
- **Images:** correct sizes served, no layout shift.
- **Tables/long content:** overflow handled (`overflow-x: auto`) or reflowed.
- **Performance on mid-range phones** and slow networks.
- **Input types & keyboards:** `type="email"`, `inputmode`, `autocomplete` on forms.
- **Safe areas** (notches): `env(safe-area-inset-*)`.
- **Preferences:** dark mode, reduced motion.

---

## 4.3 Incorporating UX best practices into frontend development

### Before building

- **Understand users and goals:** collaborate with product/UX on personas, jobs-to-be-done and success metrics.
- **User flows & journey maps:** review the flows (happy path, edge cases, errors, empty states) and challenge gaps early.
- **Design review:** check feasibility, accessibility, responsive behaviour and states (loading, error, empty, disabled, hover, focus).
- **Design system:** use shared tokens and components (Storybook) so UI stays consistent.

### While building

- Build **all states**, not just the happy path: skeletons, error messages with recovery actions, empty states, offline handling, form validation.
- **Fast feedback:** optimistic updates, immediate validation, clear loading indicators, and success/failure confirmations.
- **Progressive enhancement** and **usability heuristics** (Nielsen's 10: visibility of system status, error prevention, consistency, etc.).
- Build small increments and share preview deployments (PR previews) so designers and PMs can review real behaviour early.
- Use **feature flags** to ship gradually and run **A/B tests**.

### Usability testing and feedback loop

1. **Test early with prototypes** (Figma) and again with working builds. Even 5 users reveal most major issues.
2. **Methods:** moderated/unmoderated tests, task-based scenarios, think-aloud, first-click tests, guerrilla testing.
3. **Quantitative data:** analytics funnels, drop-off points, heatmaps and session recordings (Hotjar, FullStory), Core Web Vitals, error monitoring.
4. **Qualitative data:** surveys (SUS, NPS), support tickets, user interviews.
5. **Prioritise findings** by severity and frequency (e.g., impact/effort matrix), convert into backlog tickets with clear acceptance criteria.
6. **Iterate:** fix, re-test, measure improvement against the original metrics.

### Metrics to watch

Task completion rate, time on task, error rate, conversion, bounce rate, feature adoption, satisfaction scores, and accessibility audit results.

---

<a id="section-5"></a>

# 5. Deployment / Tooling / Collaboration

## 5.1 Build tools, bundlers and version-control workflow

### Build tools / bundlers

| Tool                   | Best for                                        | Why I like / dislike it                                                                                                                    |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vite** (my default)  | Most new SPAs and libraries                     | Instant dev server using native ESM and esbuild, fast HMR, Rollup-based optimised production builds, great plugin ecosystem, simple config |
| **Webpack**            | Legacy or very custom builds, module federation | Mature and highly configurable, but slower and more complex config                                                                         |
| **esbuild / SWC**      | Fast transpiling/bundling                       | Extremely fast; less plugin flexibility                                                                                                    |
| **Turbopack / Rspack** | Large apps needing speed                        | Faster than Webpack, with Webpack-compatible ecosystems (Rspack)                                                                           |
| **Rollup / tsup**      | Libraries                                       | Clean ESM output, good tree-shaking                                                                                                        |
| **Next.js / Nuxt**     | Full-stack, SSR/SSG needs                       | Routing, SSR, image optimisation and API routes built in                                                                                   |

**Supporting tooling:** TypeScript, ESLint + Prettier, Stylelint, Husky + lint-staged (pre-commit hooks), Vitest/Jest + Testing Library, Playwright/Cypress for E2E, Storybook, pnpm (fast, disk-efficient package manager), monorepo tools (Turborepo / Nx) when multiple packages are involved.

### Version-control workflow

- **Git with trunk-based development** (short-lived feature branches, small frequent PRs merged to `main`) plus **feature flags** for incomplete work. It fits CI/CD best and avoids long-lived merge conflicts.
- **GitFlow** only when release cycles are formal/scheduled (e.g., versioned products with multiple supported releases).
- **Branch naming:** `feature/…`, `fix/…`, `chore/…`.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, …) enable automated changelogs and semantic versioning (semantic-release / changesets).
- **Pull requests:** small and focused, with template checklists, mandatory code review (1–2 approvers), required status checks (lint, type-check, tests, build), protected `main`, and preview deployments.
- **Merge strategy:** squash-merge for a clean history (or rebase for linear history).
- **CI/CD:** GitHub Actions / GitLab CI: install (cached) → lint → type-check → unit tests → build → E2E → deploy (staging automatically, production with approval or automatically behind flags).

---

## 5.2 Integrating with backend APIs securely, environment variables, and dev builds

### Secure API integration

1. **Always use HTTPS**, and enable HSTS.
2. **Authentication:**
   - Prefer **HttpOnly, Secure, SameSite cookies** for session/refresh tokens: JavaScript cannot read them, reducing XSS token theft.
   - If using bearer tokens (JWT), keep access tokens short-lived and in memory; use refresh-token rotation. Avoid storing sensitive tokens in `localStorage`.
   - Use OAuth 2.0 / OIDC **Authorization Code flow with PKCE** for third-party login.
3. **CSRF protection** when using cookies: `SameSite`, anti-CSRF tokens, custom headers.
4. **CORS:** the backend must allow only trusted origins (never `*` with credentials).
5. **XSS prevention:** rely on framework escaping, never use `dangerouslySetInnerHTML`/`v-html` with untrusted data (sanitise with DOMPurify if needed), and set a strict **Content-Security-Policy**.
6. **Input validation on both sides:** the frontend validates for UX, but the backend is the source of truth (use schemas like Zod/Yup, OpenAPI-generated types).
7. **Never trust the client:** authorisation checks happen on the server; hiding a button is not security.
8. **Rate limiting, secure headers** (`X-Content-Type-Options`, `Referrer-Policy`) and **dependency scanning** (`npm audit`, Dependabot, Snyk); use Subresource Integrity for third-party scripts.
9. **Centralised API layer:** one Axios/fetch wrapper that attaches auth, handles 401 (refresh/redirect), retries, timeouts, error normalisation and logging.
   ```js
   // api/client.js
   export async function api(path, options = {}) {
     const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
       credentials: "include", // send HttpOnly cookies
       headers: { "Content-Type": "application/json", ...options.headers },
       ...options,
     });
     if (res.status === 401) {
       /* refresh token or redirect to login */
     }
     if (!res.ok)
       throw new Error(
         (await res.json().catch(() => ({}))).message || res.statusText,
       );
     return res.json();
   }
   ```
10. **Avoid CORS pain in dev/prod:** use a dev proxy or a BFF (Backend-for-Frontend) that keeps secrets server-side and aggregates APIs.

### Environment variables

- **Anything in the frontend bundle is public.** Never put secrets (API keys with write access, DB credentials, private tokens) in frontend env variables. Secrets belong on the server / BFF.
- Only expose intentionally public values with the tool's prefix: `VITE_`, `NEXT_PUBLIC_`, `REACT_APP_`.
- Use separate files per environment: `.env`, `.env.development`, `.env.staging`, `.env.production`; `.env.local` and secrets are **git-ignored**; commit only `.env.example`.
- Inject values at **build time** via CI/CD secrets (GitHub Actions secrets, Vercel/Netlify env settings); for "build once, deploy many," load a runtime `config.json` instead.
- **Validate env vars at startup** (e.g., Zod schema) to fail fast if something is missing.

  ```
  # .env.development
  VITE_API_URL=http://localhost:4000/api
  # .env.production
  VITE_API_URL=https://api.example.com
  ```

### Dev builds vs production builds

- **Dev:** dev server with HMR, source maps, verbose warnings, mock/proxy to a local or staging API (`server.proxy` in Vite), tools like MSW (Mock Service Worker) to mock APIs when the backend isn't ready.
- **Production:** minification, tree-shaking, code-splitting, hashed filenames, source maps uploaded privately to error tracking (Sentry), console logs stripped, analytics enabled.
- **Environments:** local → preview (per PR) → staging → production, each with its own API URL and config.
- **Contract with backend:** OpenAPI/Swagger or GraphQL schema to generate typed clients, plus contract testing so changes don't silently break the UI.
- **Monitoring:** error tracking (Sentry), logs, and RUM in production.

---

## 5.3 Collaborating with designers, backend engineers, QA and product teams

### Product managers

- Join **backlog refinement/planning**: clarify requirements, user stories and acceptance criteria before development starts.
- Flag technical trade-offs and effort early; propose scope options (MVP first) rather than just saying "no".
- Demo work regularly (sprint reviews, preview links); align on **Definition of Done** and success metrics.

### Designers

- Involve them early; review Figma files together for feasibility, responsive behaviour, states and accessibility before coding.
- Share a **design system**: design tokens (colours, spacing, typography) synced between Figma and code; document components in **Storybook**.
- Use Figma Dev Mode / inspect for specs; agree on naming conventions.
- **Design QA:** share preview deployments and have designers review implemented UI against designs; use visual regression tools (Chromatic, Percy) to catch unintended changes.
- Discuss constraints openly (e.g., performance cost of animations, browser support) and suggest alternatives.

### Backend engineers

- Agree on the **API contract first** (OpenAPI / GraphQL schema), so both sides can work in parallel; generate types/clients from it.
- Use **mock servers / MSW** until endpoints are ready; make sure of consistent error formats, pagination, filtering, and status codes.
- Discuss performance: payload size, caching headers, avoiding N+1 calls, whether a BFF or GraphQL would simplify the frontend.
- Coordinate on auth flows, CORS, versioning and deprecations; handle breaking changes with clear communication and versioned endpoints.
- Review each other's PRs when changes span layers; keep shared docs up to date.

### QA / testers

- Bring QA in **early** (shift-left): review acceptance criteria and testability during refinement.
- Provide **preview environments**, seed/test data, and clear steps to reproduce the feature's states.
- Agree on a test pyramid: unit tests (Vitest/Jest), component tests (Testing Library), E2E (Playwright/Cypress) for critical flows, plus accessibility and cross-browser checks. Developers write unit/component tests; QA focuses on exploratory testing and E2E strategy.
- Use well-written bug reports (steps, expected vs actual, screenshots, console logs, browser/device); triage together by severity and priority.
- Add regression tests for every fixed bug; use `data-testid` (or role-based queries) for stable selectors.

### Team-wide practices

| Practice                                                                                   | Purpose                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------ |
| Agile ceremonies (planning, stand-up, retro, demos)                                        | Alignment and continuous improvement |
| Shared documentation (README, ADRs, Confluence/Notion)                                     | Onboarding and decision history      |
| Code reviews with clear standards (ESLint, Prettier, PR templates)                         | Quality and knowledge sharing        |
| CI/CD with automated checks and preview URLs                                               | Fast, safe feedback                  |
| Transparent communication (Slack/Teams, issue trackers such as Jira/Linear, async updates) | Fewer surprises                      |
| Blameless post-mortems                                                                     | Learn from incidents                 |
| Feature flags & staged rollouts                                                            | Reduce release risk                  |

**Mindset:** treat designers, backend, QA and product as partners with shared ownership of quality. Communicate early, show work often, document decisions, and focus on the user outcome rather than on team boundaries.

---

_End of document._
