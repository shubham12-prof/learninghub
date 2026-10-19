# 06 - Coding: A Searchable List with Filters

> **Time to learn:** ~75 min (build it yourself first!) | **Difficulty:** Easy to Medium | **Interview frequency:** Very high (the classic "build a component" question)
> This is your **1 working component** for Day 3. A second option, a counter with filters, is in section 9.

## 1. The problem

Build a React component `SearchableList` for LearningHub that shows a list of courses and lets the user:

1. **Search** by title (case-insensitive, as they type).
2. **Filter by category** (a dropdown that lists the categories found in the data, plus "All").
3. **Show free courses only** (a checkbox).
4. **Sort** by title (A to Z) or by duration (shortest first).
5. See **"Showing X of Y courses"**, an **empty state** when nothing matches, and a **Clear filters** button.

## 2. How to think about it (this is what interviewers listen for)

**Step 1: what is state, what is derived?**

| Value                                     | State or derived? | Why                                                    |
| ----------------------------------------- | ----------------- | ------------------------------------------------------ |
| `query`, `category`, `freeOnly`, `sortBy` | **State**         | The user changes them; nothing else can calculate them |
| `courses`                                 | **Prop**          | Comes from the parent (makes the component reusable)   |
| `categories`                              | **Derived**       | Calculated from `courses`                              |
| `visible` (the filtered, sorted list)     | **Derived**       | Calculated from `courses` + the four state values      |
| `hasFilters`                              | **Derived**       | `query !== "" \|\| category !== ALL \|\| freeOnly`     |

> **Golden rule:** don't put `visible` in state and don't use `useEffect` to keep it in sync. Calculate it during render. One source of truth, no sync bugs.

**Step 2: controlled inputs.** Every control reads its `value`/`checked` from state and writes back in `onChange` (see `05-controlled-components.md`).

**Step 3: build in small steps** (static list -> search -> category -> free-only -> sort -> clear -> empty state). Test in the browser after each step.

## 3. Setup (Vite)

```bash
npm create vite@latest learninghub-day3 -- --template react
cd learninghub-day3
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You'll create/replace these files:

```
src/
├── courses.js
├── SearchableList.jsx
├── App.jsx
└── index.css   (optional styling)
```

## 4. The solution

### `src/courses.js`

```js
export const COURSES = [
  {
    id: 1,
    title: "JavaScript Basics",
    category: "Frontend",
    level: "Beginner",
    hours: 10,
    free: true,
  },
  {
    id: 2,
    title: "Advanced JavaScript",
    category: "Frontend",
    level: "Advanced",
    hours: 18,
    free: false,
  },
  {
    id: 3,
    title: "React Fundamentals",
    category: "Frontend",
    level: "Beginner",
    hours: 14,
    free: true,
  },
  {
    id: 4,
    title: "Node.js and Express",
    category: "Backend",
    level: "Intermediate",
    hours: 20,
    free: false,
  },
  {
    id: 5,
    title: "SQL for Beginners",
    category: "Data",
    level: "Beginner",
    hours: 8,
    free: true,
  },
  {
    id: 6,
    title: "Python for Data Analysis",
    category: "Data",
    level: "Intermediate",
    hours: 16,
    free: false,
  },
  {
    id: 7,
    title: "REST API Design",
    category: "Backend",
    level: "Intermediate",
    hours: 9,
    free: true,
  },
  {
    id: 8,
    title: "CSS Layouts",
    category: "Frontend",
    level: "Beginner",
    hours: 6,
    free: true,
  },
];
```

### `src/SearchableList.jsx`

```jsx
import { useState } from "react";

const ALL = "All";

export default function SearchableList({ courses }) {
  // ---- State: only what the user can change ----
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState("title");

  // ---- Derived values: calculated on every render, never stored ----
  const categories = [ALL, ...new Set(courses.map((c) => c.category))];

  const q = query.trim().toLowerCase();
  const visible = courses
    .filter((c) => c.title.toLowerCase().includes(q)) // search (empty q matches everything)
    .filter((c) => category === ALL || c.category === category) // category
    .filter((c) => !freeOnly || c.free) // free only
    .sort(
      (
        a,
        b, // filter() made a NEW array, so sorting it doesn't mutate props
      ) =>
        sortBy === "hours" ? a.hours - b.hours : a.title.localeCompare(b.title),
    );

  const hasFilters = query !== "" || category !== ALL || freeOnly;

  function clearFilters() {
    setQuery("");
    setCategory(ALL);
    setFreeOnly(false);
  }

  return (
    <section aria-labelledby="courses-heading">
      <h2 id="courses-heading">Courses</h2>

      <div className="filters">
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
          />
          Free only
        </label>

        <label>
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="title">Title (A to Z)</option>
            <option value="hours">Duration (shortest)</option>
          </select>
        </label>

        <button type="button" onClick={clearFilters} disabled={!hasFilters}>
          Clear filters
        </button>
      </div>

      <p role="status">
        Showing {visible.length} of {courses.length} courses
      </p>

      {visible.length === 0 ? (
        <p>No courses match your filters.</p>
      ) : (
        <ul className="course-list">
          {visible.map((course) => (
            <li key={course.id}>
              <strong>{course.title}</strong>
              <span>
                {course.category} · {course.level} · {course.hours}h
              </span>
              {course.free && <span className="badge">Free</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

### `src/App.jsx`

```jsx
import SearchableList from "./SearchableList";
import { COURSES } from "./courses";
import "./index.css";

export default function App() {
  return (
    <main>
      <h1>LearningHub</h1>
      <SearchableList courses={COURSES} />
    </main>
  );
}
```

### `src/index.css` (optional)

```css
body {
  font-family: system-ui, sans-serif;
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: end;
  margin-bottom: 1rem;
}
.filters label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.9rem;
}
.course-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}
.course-list li {
  display: grid;
  gap: 0.15rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.course-list li span {
  color: #555;
  font-size: 0.9rem;
}
.badge {
  justify-self: start;
  background: #dcfce7;
  color: #166534;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
}
```

## 5. Why this solution is written this way

| Decision                                                    | Reason                                                                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `courses` comes in as a **prop**                            | The component is reusable: any list of objects with those fields works                                                                                   |
| **No** `useState` for the filtered list, **no** `useEffect` | The filtered list is _derived data_; calculating it during render can't go out of sync                                                                   |
| `key={course.id}`                                           | A **stable, unique** key (never the array index, see `09-interview-keys-rerendering.md`)                                                                 |
| `.filter(...)` **before** `.sort(...)`                      | `filter` returns a **new** array, so sorting doesn't mutate the `courses` prop. Calling `courses.sort(...)` directly **would** mutate the parent's array |
| `query.trim().toLowerCase()`                                | Ignores case and stray spaces                                                                                                                            |
| `q` empty -> `includes("")` is `true`                       | No special case needed for "no search"                                                                                                                   |
| `new Set(...)` for categories                               | Removes duplicates, keeps first-seen order                                                                                                               |
| `<label>` wraps each control                                | Clicking the label focuses the control and screen readers announce it                                                                                    |
| `role="status"` on the count                                | Screen readers announce the result count when it changes                                                                                                 |
| `disabled={!hasFilters}`                                    | Derived from state, no extra state needed                                                                                                                |

## 6. Complexity

- Each render does **O(n)** filtering and **O(n log n)** sorting for `n` courses. Perfectly fine for hundreds or thousands of items.
- For very large lists, first **measure**. Options: `useMemo` on `visible`, a **virtualised list** (render only visible rows), **pagination**, or server-side search.

```jsx
// Optional: only recompute when an input actually changes (e.g. when the parent re-renders for another reason)
const visible = useMemo(
  () => courses.filter(/* ... */).sort(/* ... */),
  [courses, q, category, freeOnly, sortBy],
);
```

## 7. Edge cases to mention

| Case                                               | Behaviour                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `courses` is empty                                 | `Showing 0 of 0 courses` + empty message; the category dropdown only has "All"                                                              |
| Search has only spaces                             | `trim()` makes it match everything; `hasFilters` is still `true` since `query !== ""` (acceptable; use `query.trim() !== ""` if you prefer) |
| Uppercase / lowercase                              | Both sides lower-cased                                                                                                                      |
| Special characters in the search                   | We use `includes`, not a regular expression, so `(`, `*`, `.` are safe                                                                      |
| Two courses with the same title                    | Sorted by title `localeCompare` returns 0, so their order stays as in the data (sort is stable)                                             |
| Data changes (parent passes a new list)            | The component re-renders and recalculates; nothing to sync                                                                                  |
| The selected category disappears from the new data | `category` still holds the old value, so nothing matches; reset it when `courses` changes or key the component by data version              |

## 8. Common mistakes

1. **Storing the filtered list in state** and syncing it with `useEffect`. (More code, flicker, bugs.)
2. **`courses.sort(...)`** directly: mutates a prop.
3. **`key={index}`**: breaks when the list is filtered or sorted.
4. **Uncontrolled inputs** (no `value`), so `Clear filters` can't reset them.
5. **Forgetting `toLowerCase()`** on one side of the comparison.
6. Filtering on **every keystroke through a network request** without debouncing (not an issue here, since the data is local).
7. A `<select>` with `selected` on `<option>` (use `value` on the `<select>`).
8. Defining `SearchableList` **inside** `App`: it becomes a new component type each render and loses its state.

## 9. Option B: a counter with filters

If you prefer the "counter" version, this component counts up/down by a chosen step, records each action in a **history**, and lets you filter that history.

```jsx
import { useState } from "react";

const FILTERS = ["all", "increments", "decrements"];

export default function CounterWithFilters() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState([]); // [{ id, type: "inc" | "dec", amount }]
  const [filter, setFilter] = useState("all");

  function change(type) {
    setCount((c) => (type === "inc" ? c + step : c - step));
    setHistory((h) => [...h, { id: h.length + 1, type, amount: step }]);
  }

  function reset() {
    setCount(0);
    setHistory([]);
    setFilter("all");
  }

  const incs = history.filter((h) => h.type === "inc").length; // derived
  const decs = history.filter((h) => h.type === "dec").length; // derived
  const counts = { all: history.length, increments: incs, decrements: decs };

  const shown = history.filter(
    (h) =>
      filter === "all" ||
      (filter === "increments" ? h.type === "inc" : h.type === "dec"),
  );

  return (
    <section>
      <h2>Count: {count}</h2>

      <label>
        Step
        <select value={step} onChange={(e) => setStep(Number(e.target.value))}>
          {" "}
          {/* Number(): e.target.value is a string! */}
          <option value={1}>1</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
      </label>

      <button type="button" onClick={() => change("inc")}>
        + {step}
      </button>
      <button type="button" onClick={() => change("dec")}>
        - {step}
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>

      <div role="group" aria-label="History filter">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {shown.map((h) => (
            <li key={h.id}>
              {h.type === "inc" ? "+" : "-"}
              {h.amount}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

Concepts used: functional updates (`setCount(c => ...)`), immutable array updates (`[...h, item]`), derived counts (no extra state), `Number()` for a numeric `<select>`, `aria-pressed` for toggle buttons.

## 10. The 60-second explanation (say it out loud)

> "I keep only what the user controls in state: the search text, the category, the free-only flag and the sort order. The list I display is derived: on each render I filter by title and category, then free-only, then sort a copy, so I never store the filtered list or sync it with an effect. The inputs are controlled, items use a stable `id` as the key, and I don't mutate the `courses` prop. I also show a count, an empty state and a clear button that resets the state. For a large dataset I'd measure first, then use `useMemo`, pagination or virtualisation."

## 11. Practice variations

Try each yourself before looking at the hints.

1. **Highlight the match**: wrap the matching part of the title in `<mark>`.
2. **Multi-select categories** with checkboxes instead of a dropdown.
3. **Level filter** (Beginner / Intermediate / Advanced) as radio buttons.
4. **Sort direction toggle** (ascending / descending).
5. **Debounce the search** with `useDebounce` from `04-hooks.md`.
6. **Pagination**: show 3 courses per page with Previous / Next.
7. **Persist the filters** in `localStorage` (`useLocalStorage` from `04-hooks.md`).
8. **Make it generic**: `SearchableList` takes `items`, `getLabel`, `renderItem` props (see the Day 3 project).

### Hints / answers

```jsx
// 1. Highlight (split on the match, case-insensitive; no regex, so special characters are safe)
function Highlight({ text, query }) {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
// usage: <strong><Highlight text={course.title} query={query} /></strong>

// 2. Multi-select: state is an array; toggle immutably
const [selected, setSelected] = useState([]); // e.g. ["Frontend", "Data"]
const toggleCategory = (c) =>
  setSelected((prev) =>
    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
  );
// filter: .filter((c) => selected.length === 0 || selected.includes(c.category))

// 3. Radio level filter
const [level, setLevel] = useState("All");
// {["All", "Beginner", "Intermediate", "Advanced"].map((l) => (
//   <label key={l}><input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} />{l}</label>
// ))}
// filter: .filter((c) => level === "All" || c.level === level)

// 4. Sort direction
const [dir, setDir] = useState("asc");
// compare: const diff = a.title.localeCompare(b.title); return dir === "asc" ? diff : -diff;

// 5. Debounce: filter with the debounced value, keep the input bound to the immediate value
const debouncedQuery = useDebounce(query, 300);
const q = debouncedQuery.trim().toLowerCase();

// 6. Pagination (reset to page 1 when filters change)
const PAGE_SIZE = 3;
const [page, setPage] = useState(1);
const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
const safePage = Math.min(page, totalPages); // clamp, in case the list shrank
const pageItems = visible.slice(
  (safePage - 1) * PAGE_SIZE,
  safePage * PAGE_SIZE,
);
// call setPage(1) inside the handlers that change query/category/freeOnly

// 7. Persist
const [query, setQuery] = useLocalStorage("lh-query", "");
```

## Recap

- **State** = what the user changes (query, category, freeOnly, sortBy). **Derived** = everything else (the visible list, categories, counts, `hasFilters`).
- Never store derived data or sync it with `useEffect`; calculate it during render.
- Controlled inputs, `key={id}`, never mutate props (`filter` before `sort`).
- Always handle the **empty state** and provide a **clear** action.
- Optimise only after measuring (`useMemo`, pagination, virtualisation).

## Checklist

- [ ] I built the component myself, step by step, before reading the solution
- [ ] I can explain which values are state and which are derived
- [ ] I can explain why `filter` runs before `sort`
- [ ] I can explain why there is no `useEffect` here
- [ ] I solved at least 3 practice variations
