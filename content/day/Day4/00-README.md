# Day 4: React Performance and UI (React + CSS)

> **Goal of the day:** understand _why_ React re-renders, how to skip needless renders without hurting your code, and build a responsive, accessible UI with Flexbox and Grid.
> **Time:** about 6.5 to 7.5 hours at a steady pace.

## Daily target: 1 UI feature + 5 questions

| Target             | Where                                    | Done when                                                                                               |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **1 UI feature**   | `06-coding-card-layout-and-rerenders.md` | a responsive course-card page whose render counter shows 36 -> 0 (typing) and 12 -> 1 (saving one card) |
| **5 questions**    | `07-interview-memoization.md`            | you can answer the 5 core questions out loud in under 2 minutes each                                    |
| **Bonus: project** | `08-project-responsive-accessible.md`    | you audited the broken page and your fixed page passes axe with no horizontal scroll at 320px           |

## Files (one topic per file)

| #   | File                                     | Type                                                      | Time   |
| --- | ---------------------------------------- | --------------------------------------------------------- | ------ |
| 01  | `01-memoization.md`                      | Theory: memoization, `React.memo`, referential equality   | 40 min |
| 02  | `02-usememo-usecallback.md`              | Theory: `useMemo`, `useCallback`, stale closures          | 45 min |
| 03  | `03-composition.md`                      | Theory: children, slots, move state down, lift content up | 35 min |
| 04  | `04-flexbox.md`                          | Theory: Flexbox                                           | 45 min |
| 05  | `05-grid.md`                             | Theory: Grid, `auto-fill` / `auto-fit`, responsive design | 50 min |
| 06  | `06-coding-card-layout-and-rerenders.md` | Coding: card layout + fix re-renders                      | 75 min |
| 07  | `07-interview-memoization.md`            | Interview: when memoization helps and doesn't             | 50 min |
| 08  | `08-project-responsive-accessible.md`    | Project: responsiveness and accessibility                 | 90 min |

## Suggested study order

1. **Theory (about 3.5 h):** 01 -> 02 -> 03 (React), then 04 -> 05 (CSS). Do each file's **Predict the output** before reading the answers.
2. **Coding (75 min):** `06`. Build the slow version, measure it, then fix it. Write the numbers down.
3. **Interview (50 min):** `07`. Say the 30-second answer aloud, then answer Q1 to Q5 without notes.
4. **Project (90 min):** `08`. Audit the broken page first, then build the fixed one.
5. **Last 15 min:** re-read the cheat sheet below and the "Common mistakes" of 01, 02 and 08.

## Setup

Reuse the Vite project from Day 3 (`npm create vite@latest day4 -- --template react`, then `npm install`). For the tests in `06` and `08`:

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event axe-core
```

Add to `vite.config.js`: `test: { environment: "jsdom", globals: true, setupFiles: "./src/setup.js" }`, and `src/setup.js`: `import "@testing-library/jest-dom/vitest";`.

## Cheat sheet

**Re-render fixes, cheapest first**

1. Move state down into a small component.
2. Lift content up and pass it as `children`.
3. `memo` the expensive child **and** make every prop stable.
4. `useMemo` for expensive values, `useCallback` for functions passed to memo children.
5. Virtualize long lists, defer slow updates.
6. Measure before and after (Profiler).

**Why a memoized component still re-renders:** unstable prop (inline `{}`, `[]`, `() => {}`) - JSX `children` - own state - context - custom comparator - changed `key` (remount).

**`useMemo` vs `useCallback`:** value vs function. `useCallback(fn, d)` = `useMemo(() => fn, d)`. Missing dependency = stale closure. Functional update keeps the dependency array empty and correct.

**Flexbox:** one axis. `justify-content` = main, `align-items` = cross. `flex: 1` = equal share, `flex: 0 0 240px` = fixed, `margin-left: auto` pushes right, `gap` for spacing, `min-width: 0` for overflow.

**Grid:** two axes. `repeat(auto-fill, minmax(min(16rem, 100%), 1fr))` = responsive columns with no media queries. `auto-fit` collapses empty columns (cards stretch). `grid-template-areas` for page layouts.

**Responsive:** viewport meta - mobile first with `min-width` queries - `rem`/`%`/`fr`/`clamp()` - `max-width: 100%` images - no fixed heights - test at 320px and 200% zoom.

**Accessibility:** native elements first (`button`, `label`, `nav`, `main`) - visible focus - 4.5:1 contrast - text alternatives (`alt=""` for decorative) - one `h1`, ordered headings - `role="status"` for announcements - targets at least 44px - never block zoom - always test with the keyboard.

## Final checklist for the day

- [ ] I can explain why `memo` fails with inline objects, functions and JSX children
- [ ] I can fix a stale closure with a dependency or a functional update
- [ ] I can say when NOT to memoize
- [ ] I can write the responsive card grid and the Flexbox patterns from memory
- [ ] I measured render counts before and after my fix
- [ ] My page works with the keyboard, at 320px and at 200% zoom
