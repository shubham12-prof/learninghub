# 06 - Coding: Responsive Card Layout + Fixing Unnecessary Re-renders

> **Time to build:** ~75 min | **Level:** Practice | **Target:** 1 UI feature (a responsive course-card page that doesn't re-render needlessly)
> You'll do **both** options from the plan: Part A builds the responsive card layout, Part B finds and fixes the re-renders.
> Needs: Day 3 `10-project` Vite setup (`npm create vite@latest day4 -- --template react`), React 19.

## 1. The feature

A **Courses** page for LearningHub:

- a **search** box (filters by title)
- a **responsive grid of cards** (1 column on phones, more columns on wider screens, **no media queries**)
- a **"Save" toggle** on each card (favourites)
- a status line: "12 courses, 3 saved"
- a private **notes** box (unrelated state, the thing that triggers pointless re-renders)

Then you prove, with a **render counter**, that typing in the notes box and saving one card re-render **as few cards as possible**.

## 2. Setup files

### `src/courses.js`

```js
export const COURSES = [
  {
    id: 1,
    title: "HTML Foundations",
    category: "Web",
    level: "Beginner",
    hours: 4,
    free: true,
  },
  {
    id: 2,
    title: "CSS Layout with Flexbox and Grid",
    category: "Web",
    level: "Beginner",
    hours: 6,
    free: true,
  },
  {
    id: 3,
    title: "JavaScript Essentials",
    category: "JavaScript",
    level: "Beginner",
    hours: 10,
    free: true,
  },
  {
    id: 4,
    title: "Async JavaScript",
    category: "JavaScript",
    level: "Intermediate",
    hours: 8,
    free: false,
  },
  {
    id: 5,
    title: "React Fundamentals",
    category: "React",
    level: "Beginner",
    hours: 9,
    free: true,
  },
  {
    id: 6,
    title: "React Performance",
    category: "React",
    level: "Intermediate",
    hours: 7,
    free: false,
  },
  {
    id: 7,
    title: "Accessible UI Design",
    category: "Web",
    level: "Intermediate",
    hours: 5,
    free: true,
  },
  {
    id: 8,
    title: "TypeScript for React",
    category: "TypeScript",
    level: "Intermediate",
    hours: 8,
    free: false,
  },
  {
    id: 9,
    title: "Node.js and Express",
    category: "Backend",
    level: "Intermediate",
    hours: 12,
    free: false,
  },
  {
    id: 10,
    title: "Testing React Components",
    category: "React",
    level: "Intermediate",
    hours: 6,
    free: true,
  },
  {
    id: 11,
    title: "Git and GitHub Basics",
    category: "Tools",
    level: "Beginner",
    hours: 3,
    free: true,
  },
  {
    id: 12,
    title: "REST API Design",
    category: "Backend",
    level: "Advanced",
    hours: 8,
    free: false,
  },
];
```

### `src/renderLog.js` (a debugging helper)

```js
// Debug-only render counter. Every card calls logRender(id) while rendering.
export const renderLog = [];
export const logRender = (id) => {
  renderLog.push(id);
};
```

> Writing to an outside array during render is **impure** (Day 3 `03-rendering.md`). It is acceptable here only as a **temporary measuring tool** (and StrictMode will double the numbers in development). In real projects use the **React DevTools Profiler** ("Highlight updates when components render") or `<Profiler>`.

## 3. Part B first: the SLOW version (reproduce the problem)

Create `src/SlowApp.jsx`. It works, and it is exactly what many first versions look like.

```jsx
import { useState } from "react";
import { COURSES } from "./courses";
import { logRender } from "./renderLog";

function SlowCard({ course, isFavorite, onToggle }) {
  logRender("slow-" + course.id);
  return (
    <li className="card">
      <h3>{course.title}</h3>
      <p className="card-meta">
        <span className="badge">{course.category}</span>
        <span className="badge">{course.level}</span>
        <span>{course.hours} h</span>
      </p>
      <div className="card-actions">
        <span>{course.free ? "Free" : "Paid"}</span>
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={`Save ${course.title}`}
          onClick={onToggle}
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span> Save
        </button>
      </div>
    </li>
  );
}

export default function SlowApp() {
  const [note, setNote] = useState("");
  const [favorites, setFavorites] = useState([]);

  function toggleFavorite(id) {
    setFavorites(
      favorites.includes(id)
        ? favorites.filter((x) => x !== id)
        : [...favorites, id],
    );
  }

  return (
    <main className="page">
      <h1>Courses (slow)</h1>
      <label>
        Notes
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <p role="status">
        {COURSES.length} courses, {favorites.length} saved
      </p>
      <ul className="cards">
        {COURSES.map((c) => (
          <SlowCard
            key={c.id}
            course={c}
            isFavorite={favorites.includes(c.id)}
            onToggle={() => toggleFavorite(c.id)}
          />
        ))}
      </ul>
    </main>
  );
}
```

### Measure it

1. Load the app, then type 3 characters in **Notes**. Every keystroke re-renders **all 12** cards (the parent's state changed).
2. Click **Save** on one card. All 12 cards re-render again (the parent's `favorites` changed).

| Action                     | Card renders | Needed |
| -------------------------- | ------------ | ------ |
| First render               | 12           | 12     |
| Type 3 characters in Notes | **36**       | 0      |
| Save one card              | **12**       | 1      |

## 4. Diagnose

Two different causes, two different fixes:

| Problem                               | Cause                                                                                                                   | Fix (cheapest first)                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Typing in Notes re-renders every card | `note` state lives in the same component as the cards (the cards are its children)                                      | **Move state down** into a `NoteBox` component                                                                           |
| Saving one card re-renders all cards  | `favorites` changed in the parent; cards aren't memoized; and `onToggle={() => ...}` is a **new function every render** | `memo` on the card + a **stable** `toggleFavorite` (`useCallback` + functional update), passing a primitive `isFavorite` |

## 5. The FIXED version

### `src/NoteBox.jsx` (state moved down)

```jsx
import { useState } from "react";

export default function NoteBox() {
  const [note, setNote] = useState("");
  return (
    <label className="note">
      Private notes
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Jot something down"
      />
    </label>
  );
}
```

### `src/CourseCard.jsx` (memoized, flexbox inside)

```jsx
import { memo } from "react";
import { logRender } from "./renderLog";

const CourseCard = memo(function CourseCard({ course, isFavorite, onToggle }) {
  logRender(course.id);
  return (
    <li className="card">
      <h3>{course.title}</h3>
      <p className="card-meta">
        <span className="badge">{course.category}</span>
        <span className="badge">{course.level}</span>
        <span>{course.hours} h</span>
      </p>
      <div className="card-actions">
        <span>{course.free ? "Free" : "Paid"}</span>
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={`Save ${course.title}`}
          onClick={() => onToggle(course.id)}
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span> Save
        </button>
      </div>
    </li>
  );
});

export default CourseCard;
```

Why this works: every prop is **stable** between unrelated renders: `course` is the same object from `COURSES`, `isFavorite` is a **boolean** (primitive), and `onToggle` is the same function (next file).

### `src/App.jsx`

```jsx
import { useState, useMemo, useCallback } from "react";
import { COURSES } from "./courses";
import CourseCard from "./CourseCard";
import NoteBox from "./NoteBox";

export default function App() {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Stable identity + never stale: the functional update means we don't read `favorites` here
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  // Cheap with 12 items; shown for the pattern. Measure before keeping it with a big list.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURSES.filter((c) => c.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="page">
      <h1>Courses</h1>

      <div className="toolbar">
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p role="status">
          {visible.length} courses, {favorites.length} saved
        </p>
      </div>

      <NoteBox />

      {visible.length === 0 ? (
        <p>No courses match "{query}".</p>
      ) : (
        <ul className="cards">
          {visible.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              isFavorite={favorites.includes(c.id)}
              onToggle={toggleFavorite}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
```

### `src/main.jsx`

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

To compare, temporarily render `<SlowApp />` instead of `<App />`.

## 6. Part A: the responsive layout (`src/index.css`)

```css
:root {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --text: #1b1f2a;
  --muted: #4b5563; /* 7.5:1 on white */
  --border: #d5d9e3;
  --accent: #1d4ed8; /* 6.7:1 on white */
  --accent-text: #ffffff;
  --radius: 0.75rem;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
  line-height: 1.5;
}

.page {
  max-width: 72rem;
  margin-inline: auto;
  padding: 1rem;
}

/* toolbar: Flexbox for a single row that wraps */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-block: 1rem;
}
.toolbar label,
.note {
  display: grid;
  gap: 0.25rem;
  font-weight: 600;
}
.note {
  margin-bottom: 1rem;
  max-width: 28rem;
}
input {
  font: inherit;
  padding: 0.5rem 0.75rem;
  border: 1px solid #6b7280;
  border-radius: 0.5rem;
  min-width: 0;
} /* field border needs 3:1 against the page (4.8:1 here) */

/* the responsive grid: as many 16rem+ columns as fit, no media queries */
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
  gap: 1rem;
}

/* each card: Flexbox column so the actions sit at the bottom, equal heights from the grid */
.card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.card h3 {
  margin: 0;
  font-size: 1.125rem;
  overflow-wrap: anywhere;
}
.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--muted);
}
.badge {
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.875rem;
}
.card-actions {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

button {
  font: inherit;
  cursor: pointer;
  min-height: 2.75rem;
  padding: 0.25rem 0.875rem; /* comfortable touch target (about 44px) */
  border: 1px solid var(--accent);
  border-radius: 0.5rem;
  background: var(--surface);
  color: var(--accent);
}
button[aria-pressed="true"] {
  background: var(--accent);
  color: var(--accent-text);
}

:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
```

### What each CSS decision gives you

| Rule                                                                                     | Purpose                                                                  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `repeat(auto-fill, minmax(min(16rem, 100%), 1fr))`                                       | responsive columns; `min(…, 100%)` stops overflow on very narrow screens |
| `.card { display: flex; flex-direction: column }` + `.card-actions { margin-top: auto }` | buttons align at the bottom of equal-height cards                        |
| `min-width: 0` + `overflow-wrap: anywhere`                                               | a very long title can't break the layout                                 |
| `.toolbar { flex-wrap: wrap }`                                                           | search + status stay on one line when there's room, stack otherwise      |
| `min-height: 2.75rem` on buttons                                                         | large enough touch target                                                |
| `:focus-visible`                                                                         | visible keyboard focus (never `outline: none` without a replacement)     |

## 7. Verify with a counter

| Action                                                | Slow | Fixed                                                                     |
| ----------------------------------------------------- | ---- | ------------------------------------------------------------------------- |
| First render                                          | 12   | 12                                                                        |
| Type 3 characters in Notes                            | 36   | **0**                                                                     |
| Save one card                                         | 12   | **1**                                                                     |
| Type `react` in Search (5 keystrokes; 4 cards remain) | n/a  | **0** extra (the remaining cards are not re-rendered, the others unmount) |

Here is a test you can drop into your project (`npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`, and add `test: { environment: "jsdom", globals: true }` to `vite.config.js`):

```jsx
import { test, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import SlowApp from "../src/SlowApp";
import { renderLog } from "../src/renderLog";

beforeEach(() => {
  renderLog.length = 0;
});

test("slow version re-renders every card", async () => {
  render(<SlowApp />);
  expect(renderLog).toHaveLength(12);
  renderLog.length = 0;
  await userEvent.type(screen.getByLabelText("Notes"), "abc");
  expect(renderLog).toHaveLength(36);
  renderLog.length = 0;
  await userEvent.click(
    screen.getByRole("button", { name: "Save HTML Foundations" }),
  );
  expect(renderLog).toHaveLength(12);
});

test("fixed version renders only what changed", async () => {
  render(<App />);
  expect(renderLog).toHaveLength(12);
  renderLog.length = 0;

  await userEvent.type(screen.getByLabelText("Private notes"), "abc");
  expect(renderLog).toHaveLength(0);

  await userEvent.click(
    screen.getByRole("button", { name: "Save HTML Foundations" }),
  );
  expect(renderLog).toEqual([1]); // only that card
  expect(
    screen.getByRole("button", { name: "Save HTML Foundations" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("status")).toHaveTextContent("12 courses, 1 saved");

  renderLog.length = 0;
  await userEvent.type(screen.getByLabelText("Search"), "react");
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(renderLog).toHaveLength(0); // survivors were not re-rendered
});

test("shows an empty state", async () => {
  render(<App />);
  await userEvent.type(screen.getByLabelText("Search"), "zzz");
  expect(screen.getByText(/No courses match/)).toBeInTheDocument();
});
```

## 8. Edge cases to check

| Case                                                          | What should happen                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **No results**                                                | An empty-state message, not an empty page                                                          |
| **1 card**                                                    | Doesn't stretch into an ugly giant card (`auto-fill` keeps its width; `auto-fit` would stretch it) |
| **Very long title** (`Supercalifragilisticexpialidocious...`) | Wraps (`overflow-wrap: anywhere`) and doesn't overflow the card                                    |
| **320px viewport**                                            | One column, no horizontal scroll (`min(16rem, 100%)`)                                              |
| **200% browser zoom / large text**                            | Still readable, layout reflows                                                                     |
| **Keyboard only**                                             | Tab reaches search, notes and each Save button; focus is visible; Space/Enter toggles              |
| **Two cards saved, then filter**                              | Saved state persists for cards that disappear and come back (state lives in `App`)                 |

## 9. Common mistakes

1. Adding `memo` to the card but keeping `onToggle={() => toggleFavorite(c.id)}` in the parent: **every card still re-renders**.
2. Passing the **whole `favorites` array** to every card; any change makes every card's prop "different". Pass a boolean per card.
3. Reading `favorites` inside `useCallback` with `[]` deps -> **stale closure**; use the functional update.
4. Optimising before measuring (or never measuring afterwards).
5. `useMemo` on a 12-item filter and calling the job done: the real wins were **moving state down** and **`memo` + stable props**.
6. Using `index` as `key` in a filtered list: favourites would jump to the wrong card (Day 3 `09`).
7. Forgetting `min-width: 0` / `overflow-wrap` so long text blows the grid.

## 10. Predict the output

Use the counters from the table above (no StrictMode).

**Q1** In **`SlowApp`**, how many card renders after the first render and typing `"hi"` into Notes?

**Q2** In the **fixed** `App`, what does `renderLog` contain after the first render, **clearing it**, and then clicking Save on card 3 ("JavaScript Essentials")?

**Q3** In the fixed `App`, you remove `useCallback` from `toggleFavorite` (a plain function). Clicking Save on card 3 now causes how many card renders? Why?

**Q4** In the fixed `App`, you change the card to receive `favorites={favorites}` (the whole array) and compute `favorites.includes(course.id)` inside the card. Clicking Save on card 3 causes how many card renders?

**Q5** In the fixed `App`, you remove `memo` from `CourseCard` but keep everything else. Typing `"abc"` into the **Notes** box causes how many card renders? And typing into **Search**?

## 11. Answers

- **Q1:** **12 + 24 = 36**. The first 12, plus 12 per keystroke x 2.
- **Q2:** `[3]`. Only card 3's `isFavorite` changed; other cards get the same `course`, boolean and function.
- **Q3:** **12**. Without `useCallback`, `onToggle` is a new function after `App` re-renders (it does, because `favorites` changed), so `memo` sees a changed prop on every card.
- **Q4:** **12**. The `favorites` array is a new array after every change, so every card's props differ. Pass a per-card **primitive**.
- **Q5:** Notes: **0**. The state lives in `NoteBox`, so `App` (and its cards) doesn't re-render: that fix doesn't need `memo`. Search: every **visible** card re-renders on each keystroke, because `App` re-renders and without `memo` its children re-render (up to 12 per keystroke).

## 12. Practice variations

1. **Option A only:** build just the card grid (`index.css`) and verify at 320px, 768px and 1280px in DevTools' device toolbar.
2. Add a **category filter** `<select>` and keep `visible` correct with `useMemo`.
3. Add a **"Show only saved"** checkbox. Does anything re-render more than it should?
4. Make a card **horizontal** when it has room using a **container query** (`05-grid.md` section 7.5).
5. Wrap the grid in `<Profiler id="cards" onRender={...}>` and log the actual render durations before and after.
6. Replace `favorites` array with a `Set` stored in state (create a **new** `Set` on every change) and pass booleans.
7. Render **2,000 cards** and compare the time taken before/after `memo`; then research "windowing / virtualization" (`react-window`).

## Recap

- Fix re-renders in order: **1) move state down**, **2) lift content up (`children`)**, **3) `memo` + stable props (`useCallback`, functional updates, primitive props)**, **4) `useMemo` for genuinely expensive values**.
- `memo` works only if **every prop is stable**: objects, arrays and inline functions silently defeat it.
- Responsive cards: `display: grid` + `repeat(auto-fill, minmax(min(16rem, 100%), 1fr))`; Flexbox inside each card with `margin-top: auto` for the action row.
- Always **measure before and after** (render counter, DevTools Profiler).

## Checklist

- [ ] My grid is responsive from 320px to 1280px with no media queries
- [ ] I can show render counts before and after (36 -> 0, 12 -> 1)
- [ ] I can explain why `memo` alone failed until `onToggle` was stable
- [ ] I handled no results, long titles and keyboard use
- [ ] I got Q1 to Q5 right without looking
