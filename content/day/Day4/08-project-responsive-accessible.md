# 08 - Project: Improve Responsiveness and Accessibility

> **Time to build:** ~90 min | **Level:** Project | **Target:** audit a broken page, fix it, and prove it with tools
> Uses `src/courses.js` from `06-coding-card-layout-and-rerenders.md` (copy it into the project).
> Plan: **(A)** audit the BROKEN version, **(B)** build the FIXED version, **(C)** prove it with automated and manual checks, **(D)** stretch goals.

## 1. Why this project

Interviewers love "make this accessible and responsive" because it tests whether you know **semantic HTML, keyboard use, ARIA, contrast, and flexible layout**, all at once. Accessibility (a11y) is not an extra: it's part of "working".

**Accessibility in one sentence:** everyone, including people using only a keyboard, a screen reader, zoom, or a small phone, can perceive, operate and understand the page.

The four WCAG principles (**POUR**): **P**erceivable, **O**perable, **U**nderstandable, **R**obust.

## 2. Part A: the BROKEN version (audit it first)

`src/BadPage.jsx`

```jsx
import { useState } from "react";
import { COURSES } from "./courses";
import "./bad.css";

const THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120'><rect width='260' height='120' fill='%23dbe4ff'/></svg>";

export default function BadPage() {
  const [saved, setSaved] = useState([]);
  const [query, setQuery] = useState("");
  const shown = COURSES.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );
  const toggle = (id) =>
    setSaved(
      saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id],
    );

  return (
    <div className="bad-page">
      <div className="bad-header">
        <img src={THUMB} />
        <div className="bad-nav">
          <a href="/courses">Courses</a>
          <a href="/about">About</a>
        </div>
      </div>

      <h4 className="bad-title">Courses</h4>
      <input
        className="bad-search"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="bad-count">{shown.length} results</div>

      <div className="bad-row">
        {shown.map((c) => (
          <div className="bad-card" key={c.id}>
            <img className="bad-thumb" src={THUMB} />
            <h6>{c.title}</h6>
            <div className="bad-meta">
              {c.level} · {c.hours} h
            </div>
            <div className="bad-save" onClick={() => toggle(c.id)}>
              {saved.includes(c.id) ? "♥" : "♡"}
            </div>
            <a href={"/courses/" + c.id}>click here</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`src/bad.css`

```css
body {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #999;
  background: #fff;
}
.bad-page {
  width: 1100px;
  margin: 0 auto;
}
.bad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.bad-nav a {
  margin-left: 20px;
  color: #aaa;
  text-decoration: none;
}
.bad-title {
  font-size: 28px;
}
.bad-search {
  width: 400px;
  padding: 6px;
  border: 1px solid #ddd;
  outline: none;
}
.bad-row {
  display: flex;
  margin-top: 16px;
}
.bad-card {
  flex: 0 0 260px;
  height: 190px;
  overflow: hidden;
  margin: 10px;
  padding: 10px;
  border: 1px solid #ddd;
}
.bad-card h6 {
  font-size: 14px;
  margin: 8px 0;
}
.bad-thumb {
  width: 240px;
  height: 80px;
}
.bad-save {
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 18px;
}
a {
  outline: none;
}
```

The page's `index.html` is broken too:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, user-scalable=no"
    />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### The audit: 14 problems

Try to find them yourself for 10 minutes first (keyboard-only, 320px wide, zoom to 200%, a screen reader or the axe browser extension).

| #   | Problem                                                             | Category                    | Who it hurts                                                                                                      | Fix                                                           |
| --- | ------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | The "Save" control is a `<div onClick>`                             | **Keyboard / semantics**    | keyboard and screen-reader users (can't focus, no role, no state)                                                 | a real `<button type="button">` with `aria-pressed`           |
| 2   | `outline: none` on links/inputs                                     | **Focus visible**           | keyboard users lose their place                                                                                   | never remove it; style `:focus-visible`                       |
| 3   | Search `<input>` has only a placeholder                             | **Labels**                  | screen readers (placeholder isn't a label), disappears when typing                                                | `<label htmlFor>`                                             |
| 4   | `<img>` without `alt`                                               | **Text alternatives**       | screen readers read the file name                                                                                 | meaningful `alt`, or `alt=""` if decorative                   |
| 5   | Headings jump (`h4`, `h6`) and there's no `h1`                      | **Structure**               | screen-reader navigation by headings                                                                              | `h1` once, then `h2` for each card                            |
| 6   | No landmarks (`header`, `nav`, `main`, `footer`) all `div`s         | **Structure**               | screen-reader users can't jump to the main content                                                                | semantic landmarks + "Skip to content" link                   |
| 7   | Text colours `#999`/`#aaa` on white (2.85:1 and 2.3:1)              | **Contrast**                | low vision                                                                                                        | at least **4.5:1** for normal text (3:1 for large text)       |
| 8   | Font sizes in `px`, base 12px                                       | **Resizable text**          | people who set a bigger default font                                                                              | `rem`, base 1rem (16px)                                       |
| 9   | `.bad-page { width: 1100px }`, cards `flex: 0 0 260px` with no wrap | **Responsive / reflow**     | phones: horizontal scrolling                                                                                      | `max-width`, CSS Grid `auto-fill`, `min(16rem, 100%)`         |
| 10  | Card `height: 190px; overflow: hidden`                              | **Text resizing / spacing** | as soon as the text grows (a longer title, a translation, the user's own text-spacing settings) it is **cut off** | no fixed heights; let content grow                            |
| 11  | Save target is 24x24px                                              | **Target size**             | touch users, tremor                                                                                               | at least 44x44px (WCAG 2.5.5 AAA, 24px is the 2.2 AA minimum) |
| 12  | Result count isn't announced                                        | **Status messages**         | screen-reader users don't hear "4 results"                                                                        | `role="status"`                                               |
| 13  | Link text "click here"                                              | **Link purpose**            | screen readers list links out of context                                                                          | "View details" + hidden course title                          |
| 14  | `user-scalable=no`, no `lang`, no `<title>`                         | **Document**                | can't pinch-zoom, wrong pronunciation, no tab name                                                                | remove `user-scalable`, `<html lang="en">`, `<title>`         |

## 3. Part B: the FIXED version

`index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Courses | LearningHub</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

`src/GoodPage.jsx`

```jsx
import { useState, useMemo, useCallback, memo } from "react";
import { COURSES } from "./courses";
import "./good.css";

const THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='320' height='180' fill='%23dbe4ff'/></svg>";

const Card = memo(function Card({ course, isSaved, onToggle }) {
  return (
    <li className="card">
      {/* decorative picture: empty alt so screen readers skip it; width/height prevent layout shift */}
      <img
        className="thumb"
        src={THUMB}
        alt=""
        width="320"
        height="180"
        loading="lazy"
      />
      <h2>{course.title}</h2>
      <p className="meta">
        {course.level} · {course.hours} h
      </p>
      <div className="actions">
        <button
          type="button"
          aria-pressed={isSaved}
          onClick={() => onToggle(course.id)}
        >
          <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span> Save{" "}
          <span className="visually-hidden">{course.title}</span>
        </button>
        <a href={"/courses/" + course.id}>
          View details{" "}
          <span className="visually-hidden">of {course.title}</span>
        </a>
      </div>
    </li>
  );
});

export default function GoodPage() {
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState([]);

  const toggle = useCallback((id) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURSES.filter((c) => c.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <p className="brand">LearningHub</p>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li>
              <a href="/courses" aria-current="page">
                Courses
              </a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main" className="page">
        <h1>Courses</h1>

        <div className="toolbar">
          <div className="field">
            <label htmlFor="course-search">Search courses</label>
            <input
              id="course-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p role="status">
            {shown.length} {shown.length === 1 ? "course" : "courses"},{" "}
            {saved.length} saved
          </p>
        </div>

        {shown.length === 0 ? (
          <p>No courses match "{query}".</p>
        ) : (
          <ul className="cards">
            {shown.map((c) => (
              <Card
                key={c.id}
                course={c}
                isSaved={saved.includes(c.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
        )}
      </main>

      <footer className="site-footer">
        <p>© LearningHub</p>
      </footer>
    </>
  );
}
```

`src/good.css`

```css
:root {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --text: #1b1f2a;
  --muted: #4b5563;
  --border: #d5d9e3;
  --accent: #1d4ed8;
  --accent-text: #ffffff;
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
  font-size: 1rem;
  line-height: 1.5;
}

/* text hidden visually but still read by screen readers */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* skip link: invisible until focused with Tab */
.skip-link {
  position: absolute;
  left: 0.5rem;
  top: -4rem;
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: var(--accent-text);
  border-radius: 0.5rem;
  z-index: 10;
}
.skip-link:focus {
  top: 0.5rem;
}

.site-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.brand {
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
}
.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav-list a {
  display: inline-block;
  padding: 0.5rem 0;
  color: var(--accent);
}
.nav-list a[aria-current="page"] {
  font-weight: 700;
  text-decoration: none;
  border-bottom: 2px solid currentColor;
}

.page {
  max-width: 72rem;
  margin-inline: auto;
  padding: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-block: 1rem;
}
.field {
  display: grid;
  gap: 0.25rem;
}
.field label {
  font-weight: 600;
}
input {
  font: inherit;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #6b7280;
  border-radius: 0.5rem;
  background: var(--surface);
  color: var(--text);
}

.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
  gap: 1rem;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}
.thumb {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 0.5rem;
}
.card h2 {
  margin: 0;
  font-size: 1.125rem;
  overflow-wrap: anywhere;
}
.meta {
  margin: 0;
  color: var(--muted);
}
.actions {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding-top: 0.5rem;
}
.actions a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--accent);
}

button {
  font: inherit;
  cursor: pointer;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0.25rem 0.875rem;
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

.site-footer {
  padding: 1rem;
  text-align: center;
  color: var(--muted);
}

@media (prefers-reduced-motion: no-preference) {
  button {
    transition:
      background-color 150ms ease,
      color 150ms ease;
  }
}
```

### What changed, mapped to the audit

| Audit # | Fix in the code                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------- |
| 1       | `<button type="button" aria-pressed>` (native keyboard + role + state)                            |
| 2       | no `outline: none`; `:focus-visible` ring                                                         |
| 3       | `<label htmlFor="course-search">`                                                                 |
| 4       | `alt=""` on decorative thumbnails (add real `alt` if the image carries information)               |
| 5       | one `<h1>`, card titles `<h2>`                                                                    |
| 6       | `header` / `nav aria-label` / `main` / `footer` + skip link                                       |
| 7       | colours checked: text `#1b1f2a` (about 16:1), muted `#4b5563` (7.5:1), accent `#1d4ed8` (6.7:1)   |
| 8       | `rem` units, base `1rem`                                                                          |
| 9       | grid `repeat(auto-fill, minmax(min(16rem, 100%), 1fr))`, `max-width`, wrapping header and toolbar |
| 10      | no fixed heights                                                                                  |
| 11      | buttons and links at least `2.75rem` (44px) tall                                                  |
| 12      | `role="status"` on the count                                                                      |
| 13      | "View details" + hidden course title ("View details of React Fundamentals")                       |
| 14      | `lang="en"`, `<title>`, viewport without `user-scalable=no`                                       |

### Why `aria-pressed` plus a constant name?

A toggle button's **name stays the same** ("Save React Fundamentals") and its **state** is exposed separately (`aria-pressed="true"` -> "pressed"). Don't change the label to "Saved" **and** set `aria-pressed`: the screen reader would say "Saved, pressed", which is confusing.

### Rules of thumb for ARIA

1. **First rule of ARIA: don't use ARIA if a native element does the job.** `<button>` beats `<div role="button" tabindex="0">` plus key handlers.
2. ARIA changes only what is **announced**, never behaviour (no focus, no keys).
3. **Bad ARIA is worse than no ARIA.**
4. Use `aria-label` only when there's no visible text. A visible label that is part of the name is better (WCAG "label in name").

## 4. Part C: prove it

### 4.1 Automated (catches roughly a third to half of problems)

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event axe-core
```

```jsx
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import GoodPage from "../src/GoodPage";

test("good page has no axe violations", async () => {
  const { container } = render(<GoodPage />);
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  }); // jsdom can't compute colours
  expect(results.violations).toEqual([]);
});

test("save works with the keyboard and exposes its state", async () => {
  render(<GoodPage />);
  const save = screen.getByRole("button", { name: "Save HTML Foundations" });
  expect(save).toHaveAttribute("aria-pressed", "false");
  await userEvent.tab(); // 1st tab stop: skip link
  expect(
    screen.getByRole("link", { name: "Skip to main content" }),
  ).toHaveFocus();
  save.focus();
  await userEvent.keyboard("{Enter}");
  expect(save).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("status")).toHaveTextContent("12 courses, 1 saved");
});

test("search is labelled and announces results", async () => {
  render(<GoodPage />);
  await userEvent.type(screen.getByLabelText("Search courses"), "react");
  expect(screen.getByRole("status")).toHaveTextContent("4 courses, 0 saved");
});
```

> Notice what axe did **not** flag in the broken page: the `<div onClick>` "button" (#1), `outline: none` (#2), the placeholder-only input (#3), the fixed card height (#10), the tiny target (#11), the silent result count (#12) and the "click here" link (#13). axe passes a placeholder as an accessible name, so the missing label is a manual finding. **This is why manual testing is mandatory.**

> jsdom cannot check **colour contrast** or **layout**. In a real browser use **Lighthouse** (Chrome DevTools -> Lighthouse -> Accessibility), the **axe DevTools** extension, or run `axe-core` in Playwright.

### 4.2 Manual checks (always required; automation can't judge these)

| Check                    | How                                                | Pass when                                                                             |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Keyboard only**        | Unplug the mouse; use Tab, Shift+Tab, Enter, Space | every control reachable and operable, order is logical, focus always visible          |
| **Skip link**            | first Tab press                                    | "Skip to main content" appears and jumps past the nav                                 |
| **320px reflow**         | DevTools -> device toolbar -> 320px                | no horizontal scroll, nothing cut off                                                 |
| **200% zoom** (and 400%) | Ctrl/Cmd + `+`                                     | content reflows, nothing overlaps or is cut off                                       |
| **Text size**            | browser setting -> larger default font             | text scales (needs `rem`)                                                             |
| **Screen reader**        | VoiceOver (Mac: Cmd+F5), NVDA (Windows, free)      | headings/landmarks list is sensible; buttons say name + "pressed"; count is announced |
| **Contrast**             | DevTools colour picker or WebAIM Contrast Checker  | text >= 4.5:1, large text and UI borders >= 3:1                                       |
| **Reduced motion**       | OS setting "reduce motion"                         | animations are disabled or minimal                                                    |
| **Colour alone**         | grayscale the page                                 | state still clear (the heart shape and `aria-pressed` styling, not just colour)       |

### 4.3 What I measured on these files

Both pages were rendered in Chromium and checked at 320px and with `axe-core` (including colour contrast):

|                | Horizontal scroll at 320px                                                                                                     | axe violations                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broken version | **yes**: the page is about 3,600px wide on a 320px screen (and still scrolls sideways at 1280px, because the cards never wrap) | **9 rules fail**: `color-contrast` (28 elements), `image-alt` (13), `document-title`, `html-has-lang`, `heading-order`, `page-has-heading-one`, `landmark-one-main`, `region`, `meta-viewport` |
| Fixed version  | **no**                                                                                                                         | **0**                                                                                                                                                                                          |

## 5. Debug exercise (use `BadPage` as the "bug hunt")

Without looking at the table in section 2, do this in order and write down each failure:

1. Press **Tab** repeatedly. What can you reach? (The links, the search box. **Not** the hearts.)
2. Press Tab on the search box. Can you see focus? (No: `outline: none`.)
3. Resize to **320px**. What happens? (Horizontal scroll.)
4. Edit one card title to a 90-character title (DevTools -> double-click the text), or apply WCAG text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em). What happens to the card? (The text is **clipped**: fixed height plus `overflow: hidden`.)
5. Run **axe** or Lighthouse. Which rules fail? Compare with the 14-row table.
6. Turn on a screen reader and open the **headings list** and **landmarks list**. What do you hear?

## 6. Common mistakes

1. `<div onClick>` as a button (no focus, no Enter/Space, no role).
2. `outline: none` without a replacement.
3. Placeholder used as a label.
4. Colour as the only way to show state (saved/unsaved, error/ok).
5. Adding `role`/`aria-*` everywhere instead of using native elements.
6. `alt` text that repeats surrounding text, or that is missing; decorative images need `alt=""`.
7. Fixed `px` widths/heights (breaks reflow and zoom).
8. `user-scalable=no` or `maximum-scale=1` (blocks zoom).
9. Hiding content with `display: none` when you wanted it hidden **visually only** (screen readers skip `display: none`).
10. Only running an automated tool and calling it done.
11. Using `order`/`row-reverse` or Grid placement to reorder content visually so it no longer matches the tab order.

## 7. Stretch goals

1. Add a **dark mode** with `prefers-color-scheme` and re-check contrast.
2. Add a **"Show only saved"** checkbox; after toggling, make sure focus isn't lost (move focus intentionally if a focused card disappears).
3. Add a **modal "Details" dialog** with the native `<dialog>` element: focus trap, Esc to close, return focus to the opener.
4. Add `@media (prefers-reduced-motion: reduce)` handling for any animation.
5. Support **Windows high contrast** (`@media (forced-colors: active)`): ensure the focus ring and pressed state still show.
6. Run **Lighthouse CI** in GitHub Actions and fail the build under 95.
7. Replace the hand-written skip link and layout with your real **LearningHub** layout and audit it with the same table.

## Recap

- Accessibility = **semantic HTML first**, then keyboard support, visible focus, labels, text alternatives, contrast, resizable text, reflow, status messages.
- Responsive = **flexible grid + relative units + no fixed heights/widths + viewport meta + zoomable**.
- Native elements (`button`, `label`, `nav`, `main`) give you most of it for free; ARIA is the last resort.
- **Automated tools find part of the problems; you must test with keyboard, zoom, small screens and a screen reader.**

## Checklist

- [ ] I found at least 10 of the 14 problems in `BadPage` myself
- [ ] My fixed page passes axe with 0 violations and has no horizontal scroll at 320px
- [ ] I can operate every control with the keyboard and see focus
- [ ] I can explain `aria-pressed`, `role="status"` and the skip link
- [ ] I can state the first rule of ARIA
