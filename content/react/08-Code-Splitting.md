# Code Splitting

Breaking a large JS bundle into smaller chunks that load on demand, instead of shipping the entire app's code upfront — reduces initial load time.

```jsx
// Without code splitting: everything, including rarely-visited pages, loads on first page view.
import Dashboard from "./Dashboard";
import AdminPanel from "./AdminPanel"; // heavy, rarely used

// With code splitting: AdminPanel's code is only downloaded when actually needed
const AdminPanel = React.lazy(() => import("./AdminPanel"));
```

React's built-in way to code-split is `React.lazy` combined with `Suspense` (see its own file) to show a fallback while the chunk loads.

**Route-based splitting is the most common and impactful pattern** (each page becomes its own chunk):

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Suspense fallback={<p>Loading page...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

Bundlers (Webpack, Vite/Rollup) automatically create separate chunk files for each dynamic `import()` call and load them on demand via injected `<script>` tags.

**Interview note:** code splitting reduces **initial** bundle size/load time, at the cost of a brief loading state the first time a given chunk is needed — a worthwhile tradeoff for large apps where most users never visit every page.
