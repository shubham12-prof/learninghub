# 10 - Project: A Reusable `Accordion` Component

> **Time:** ~90 min | **Goal:** Build one **reusable, accessible** component for LearningHub and use it in two different ways. This pulls together everything from Day 3: props, state, controlled/uncontrolled, keys, derived data, and `useId`.

The project has two parts:

- **Part A: Build** an `Accordion` (FAQ, curriculum modules, settings sections...).
- **Part B: Debug** a broken version with 4 classic React bugs.

## 1. What makes a component "reusable"?

| Principle | In this project |
|---|---|
| **Configured by props**, not hard-coded | `items`, `allowMultiple`, `className` |
| **Works with any content** | each item's `content` is any JSX (text, forms, other components) |
| **Controlled *and* uncontrolled** | the parent can own the open state (`openIds` + `onChange`) **or** let the component manage it (`defaultOpenIds`) |
| **Reports changes upward** | `onChange(nextOpenIds)` |
| **No surprises** | doesn't mutate props, doesn't need an effect, has stable keys |
| **Accessible by default** | real `<button>`s, `aria-expanded`, `aria-controls`, `role="region"` |

## 2. The API (props)

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `items` | `{ id, title, content }[]` | required | The sections. `id` must be **unique and stable** |
| `allowMultiple` | `boolean` | `false` | If `false`, opening one section closes the others |
| `openIds` | `id[]` | `undefined` | **Controlled** mode: the parent decides what is open |
| `defaultOpenIds` | `id[]` | `[]` | **Uncontrolled** mode: the initial open sections |
| `onChange` | `(nextOpenIds) => void` | none | Called with the new list of open ids whenever the user toggles |
| `className` | `string` | `""` | Extra class for styling |

**Controlled vs uncontrolled rule:** if `openIds` is provided, the component is controlled and shows exactly that. Otherwise it keeps its own state starting from `defaultOpenIds`. (This is the same pattern as `<input value>` vs `<input defaultValue>` in `05-controlled-components.md`.)

## 3. Requirements

1. Render each item as a **button header** and a **panel**.
2. Clicking a header toggles that panel. With `allowMultiple={false}`, opening one closes the others.
3. Works **uncontrolled** (`defaultOpenIds`) and **controlled** (`openIds` + `onChange`).
4. Calls `onChange` with the **new array** of open ids on every toggle.
5. **Never** mutates props or state. **No `useEffect`, no duplicated state.**
6. Items are keyed by `item.id`.
7. Accessibility: header is a `<button>` inside a heading; `aria-expanded`; the button controls the panel (`aria-controls`) and the panel is labelled by the button (`aria-labelledby`); closed panels are `hidden`.
8. Panels keep their internal state (like typed text) when closed and reopened.
9. Reordering `items` keeps each item's content state with the right item.

## 4. Setup

Use the same Vite project as `06-coding-searchable-list.md` (`learninghub-day3`). You'll add:

```
src/
├── Accordion.jsx      <- the reusable component
├── App.jsx            <- replace it: a page using SearchableList + two Accordions
└── index.css          <- append the accordion styles
```

### Starter `src/Accordion.jsx`

```jsx
import { useState, useId } from "react";

export default function Accordion({
  items,
  allowMultiple = false,
  openIds: controlledOpenIds,
  defaultOpenIds = [],
  onChange,
  className = "",
}) {
  // TODO 1: decide if this is controlled (controlledOpenIds !== undefined)
  // TODO 2: internal state for uncontrolled mode (initial value: defaultOpenIds,
  //         but only ONE id if allowMultiple is false). Use the lazy initialiser.
  // TODO 3: `openIds` = the controlled value if controlled, else the internal state
  // TODO 4: toggle(id) -> compute the NEXT array (never mutate), update internal
  //         state only if uncontrolled, ALWAYS call onChange?.(next)
  // TODO 5: render: for each item -> <h3><button aria-expanded aria-controls id> + a panel
  //         with role="region", aria-labelledby, hidden={!isOpen}. Use useId() for unique ids.
}
```

### Hints (read only if stuck)

1. `const isOpen = openIds.includes(item.id)` is **derived**, don't store it.
2. Next state: if open -> `openIds.filter((x) => x !== id)`; else -> `allowMultiple ? [...openIds, id] : [id]`.
3. IDs for `aria-*` must be unique on the page even with two accordions: use `useId()` once per component and add the item id.
4. `hidden` keeps the panel's children **mounted** (their state survives). `{isOpen && item.content}` would unmount them and lose their state.
5. Don't call `setInternalOpenIds` in controlled mode.

## 5. Part A: Solution (try first!)

### `src/Accordion.jsx`

```jsx
import { useState, useId } from "react";

export default function Accordion({
  items,
  allowMultiple = false,
  openIds: controlledOpenIds,
  defaultOpenIds = [],
  onChange,
  className = "",
}) {
  const baseId = useId();                                    // unique prefix for aria ids, SSR-safe

  // Controlled if the parent passes `openIds`; otherwise we keep our own state.
  const isControlled = controlledOpenIds !== undefined;
  const [internalOpenIds, setInternalOpenIds] = useState(
    () => (allowMultiple ? defaultOpenIds : defaultOpenIds.slice(0, 1))   // lazy init, respects single-open mode
  );
  const openIds = isControlled ? controlledOpenIds : internalOpenIds;     // ONE source of truth per mode

  function toggle(id) {
    const isOpen = openIds.includes(id);
    let next;
    if (isOpen) {
      next = openIds.filter((x) => x !== id);                // close it
    } else {
      next = allowMultiple ? [...openIds, id] : [id];        // open it (and close the rest in single mode)
    }
    if (!isControlled) setInternalOpenIds(next);             // controlled mode: the parent updates `openIds`
    onChange?.(next);                                        // always report the change upward
  }

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);            // derived, never stored
        const buttonId = `${baseId}-button-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                {item.title}
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### `src/App.jsx` (replace)

```jsx
import { useState } from "react";
import Accordion from "./Accordion";
import SearchableList from "./SearchableList";
import { COURSES } from "./courses";
import "./index.css";

// A stateful piece of content, to prove panels keep their state
function Notes({ label }) {
  const [text, setText] = useState("");
  return (
    <label>
      {label}
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </label>
  );
}

const FAQ = [
  { id: "free", title: "Are there free courses?", content: <p>Yes, filter the course list by "Free only".</p> },
  { id: "cert", title: "Do I get a certificate?", content: <p>Every completed course includes one.</p> },
  { id: "time", title: "How long does a course take?", content: <p>Between 6 and 20 hours.</p> },
];

const MODULES = [
  { id: "m1", title: "Module 1: JavaScript", content: <Notes label="Notes for module 1" /> },
  { id: "m2", title: "Module 2: React", content: <Notes label="Notes for module 2" /> },
  { id: "m3", title: "Module 3: APIs", content: <Notes label="Notes for module 3" /> },
];

export default function App() {
  // Controlled accordion: the parent owns the open state, so it can expand/collapse everything
  const [openModules, setOpenModules] = useState(["m1"]);
  const [reversed, setReversed] = useState(false);
  const modules = reversed ? [...MODULES].reverse() : MODULES;

  return (
    <main>
      <h1>LearningHub</h1>
      <SearchableList courses={COURSES} />

      <h2>FAQ (uncontrolled, one open at a time)</h2>
      <Accordion className="accordion" items={FAQ} defaultOpenIds={["free"]} />

      <h2>Curriculum (controlled, several open)</h2>
      <p>
        <button type="button" onClick={() => setOpenModules(MODULES.map((m) => m.id))}>Expand all</button>
        <button type="button" onClick={() => setOpenModules([])}>Collapse all</button>
        <button type="button" onClick={() => setReversed(!reversed)}>Reverse order</button>
      </p>
      <Accordion
        className="accordion"
        items={modules}
        allowMultiple
        openIds={openModules}
        onChange={setOpenModules}
      />
    </main>
  );
}
```

### Append to `src/index.css`

```css
.accordion { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem; }
.accordion h3 { margin: 0; }
.accordion h3 button { width: 100%; text-align: left; padding: .75rem 1rem; background: #f8fafc; border: 0; border-bottom: 1px solid #e5e7eb; cursor: pointer; font: inherit; }
.accordion h3 button[aria-expanded="true"] { background: #eef2ff; font-weight: 600; }
.accordion [role="region"] { padding: .75rem 1rem; }
```

> **Gotcha:** the `hidden` attribute hides an element with the browser's default `display: none`. If you ever set `display: flex/grid/block` on the panel in your CSS, that **overrides** `hidden` and the panel stays visible. Put layout styles on an inner element, or add `[hidden] { display: none; }`.

### Why it works

- **One source of truth per mode.** `openIds` is either the parent's value (controlled) or our own state (uncontrolled). We never copy the parent's value into state.
- **`isOpen` is derived** from `openIds.includes(id)`: nothing to keep in sync, no `useEffect`.
- **Immutable updates**: `filter` and spread create new arrays.
- **`onChange` always fires**, so a controlled parent can update, and an uncontrolled parent can still observe.
- **`key={item.id}`**: reordering `items` moves each item's panel (and its internal state) with it.
- **`hidden` instead of unmounting**: closed panels keep their typed text. (Trade-off: they still render, so very heavy content may prefer `{isOpen && ...}`.)
- **`useId`** gives a unique prefix, so two accordions on one page never share ids.
- **Lazy initial state** + `slice(0, 1)` makes `defaultOpenIds={["a", "b"]}` behave sensibly in single-open mode.

## 6. Test it by hand

- [ ] **FAQ:** the first question is open on load; opening another closes the first (single-open mode)
- [ ] **Curriculum:** several modules can be open at once
- [ ] **Expand all / Collapse all** work (the parent controls the open state)
- [ ] Type text into "Notes for module 1", close the panel, reopen it: the **text is still there**
- [ ] Open modules 1 and 3, type in each, click **Reverse order**: each note stays with **its own module** (keys by `id`)
- [ ] Keyboard only: `Tab` to a header, `Enter` or `Space` toggles it (native `<button>`)
- [ ] DevTools -> Accessibility tree: buttons show **expanded/collapsed**; each panel is a **region** named by its button
- [ ] No warnings in the console

### An automated test (bonus)

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

`vite.config.js`: add `test: { environment: "jsdom", globals: true, setupFiles: "./src/setupTests.js" }` (and `import { defineConfig } from "vitest/config"`). Then:

### `src/setupTests.js`

```js
import "@testing-library/jest-dom/vitest";
```

### `src/Accordion.test.jsx`

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import Accordion from "./Accordion";

const items = [
  { id: "a", title: "Alpha", content: <p>alpha body</p> },
  { id: "b", title: "Beta", content: <p>beta body</p> },
];

test("single-open mode: opening one closes the other", async () => {
  const user = userEvent.setup();
  render(<Accordion items={items} defaultOpenIds={["a"]} />);

  expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-expanded", "true");
  await user.click(screen.getByRole("button", { name: "Beta" }));

  expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("region", { name: "Beta" })).toBeVisible();
});

test("controlled mode: the parent decides, onChange reports the next ids", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Accordion items={items} allowMultiple openIds={["a"]} onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: "Beta" }));
  expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  // the parent did not update openIds, so nothing changes on screen
  expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute("aria-expanded", "false");
});

test("a stateful parent can collapse everything", async () => {
  const user = userEvent.setup();
  function Parent() {
    const [open, setOpen] = useState(["a", "b"]);
    return (
      <>
        <button onClick={() => setOpen([])}>collapse all</button>
        <Accordion items={items} allowMultiple openIds={open} onChange={setOpen} />
      </>
    );
  }
  render(<Parent />);
  await user.click(screen.getByText("collapse all"));
  expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-expanded", "false");
});
```

Run with `npx vitest`. (Testing what the user **sees and does**, with roles and names, is the modern approach: it also proves the accessibility attributes.)

## 7. Part B: Debug it

Save this as `src/AccordionBuggy.jsx` and import it in `App.jsx` **instead of** `./Accordion`. It contains **4 bugs**. Fix them **one at a time**; each fix reveals the next symptom.

### `src/AccordionBuggy.jsx`

```jsx
import { useState } from "react";

export default function Accordion({
  items,
  allowMultiple = false,
  openIds: controlledOpenIds,
  defaultOpenIds = [],
  onChange,
}) {
  const [openIds, setOpenIds] = useState(controlledOpenIds ?? defaultOpenIds);

  function toggle(id) {
    if (openIds.includes(id)) {
      openIds.splice(openIds.indexOf(id), 1);
    } else {
      openIds.push(id);
    }
    setOpenIds(openIds);
    onChange?.(openIds);
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>
          <h3>
            <button
              type="button"
              aria-expanded={openIds.includes(item.id)}
              onClick={toggle(item.id)}
            >
              {item.title}
            </button>
          </h3>
          <div role="region" aria-label={item.title} hidden={!openIds.includes(item.id)}>
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Your debugging process

For each bug write down: **(1)** what you saw, **(2)** which Day 3 concept explains it, **(3)** your fix.

| # | What you'll see | Which file explains it? |
|---|---|---|
| 1 | The page **crashes on load**: `Too many re-renders. React limits the number of renders to prevent an infinite loop.` | `01-props.md` (callback props), `03-rendering.md` (render must be pure) |
| 2 | After fixing #1: **clicking a header does nothing** (arrow stays collapsed, panel stays hidden) | `02-state.md` (never mutate state), `07-interview-usestate.md` |
| 3 | After fixing #2: the parent's **Collapse all / Expand all** buttons do nothing | `05-controlled-components.md` (controlled vs uncontrolled), `01-props.md` (copying a prop into state) |
| 4 | After fixing #3: open **Module 1 and 3**, type in each, click **Reverse order**: the typed text is now under the **wrong module** | `09-interview-keys-rerendering.md` (index keys) |

(Also notice `allowMultiple` is **never used** in the buggy file, so single-open mode is missing. That's a feature gap that your rewrite of `toggle` closes at the same time as bug 2.)

Don't scroll down until you've tried each one.

## 8. Part B: Solutions

**Bug 1: calling the handler during render.** `onClick={toggle(item.id)}` **runs** `toggle` immediately while rendering and passes its **return value** (`undefined`) as the handler. Pass a **function**:

```jsx
onClick={() => toggle(item.id)}
```

**Bug 2: mutating state.** `push`/`splice` change the existing array, and `setOpenIds(openIds)` passes the **same reference**, so React bails out. Build a **new** array (and respect `allowMultiple`):

```jsx
function toggle(id) {
  const isOpen = openIds.includes(id);
  const next = isOpen
    ? openIds.filter((x) => x !== id)
    : allowMultiple ? [...openIds, id] : [id];
  setOpenIds(next);
  onChange?.(next);
}
```

**Bug 3: copying a prop into state.** `useState(controlledOpenIds ?? ...)` reads the prop **once**; later changes from the parent are ignored. In controlled mode, **use the prop directly** and don't keep a copy:

```jsx
const isControlled = controlledOpenIds !== undefined;
const [internalOpenIds, setInternalOpenIds] = useState(defaultOpenIds);
const openIds = isControlled ? controlledOpenIds : internalOpenIds;
// in toggle: if (!isControlled) setInternalOpenIds(next);
```

**Bug 4: `key={index}`.** The panel's internal state (the `Notes` input) belongs to the **position**, so after reversing, the component in position 0 keeps its text but now belongs to a different module. Use a stable id:

```jsx
<div key={item.id}>
```

The **complete fixed version** is the Part A solution above (it also adds `useId`-based aria ids, `hidden` handling and the single-open initial state).

## 9. Stretch goals (use these on your real LearningHub)

1. **`Tabs` component** with the same controlled/uncontrolled pattern (`value` / `defaultValue` / `onChange`) and `role="tablist"`, `role="tab"`, `role="tabpanel"`.
2. **`Modal` component**: closes on **Escape** (a `useEffect` that adds a `keydown` listener and **cleans it up**), locks scrolling, and returns focus to the button that opened it.
3. **Compound components**: `<Accordion><Accordion.Item id="a" title="..."> ... </Accordion.Item></Accordion>` using **context** to share `openIds` and `toggle`.
4. **Persist** the open state with `useLocalStorage` (from `04-hooks.md`).
5. **Animate** the open/close with CSS (`grid-template-rows: 0fr` to `1fr`).
6. **Warn in development** if two items share the same `id`.
7. **Write 5 sentences** in your own words: *"Why is this component controlled **and** uncontrolled, and what does `key` do for the panels?"*

### Applying it to your real project

1. Find a piece of repeated UI in LearningHub (cards, FAQ, tabs, modals, dropdowns).
2. List its **props** (what varies) and decide what is **state** (what the user changes).
3. Does it need to work controlled and uncontrolled? If the parent might need to reset or read it, support `value` + `onChange`.
4. Check: no prop mutation, no state mutation, no effect for derived data, stable `key`s, keyboard and screen-reader support.
5. Write 2 or 3 tests with Testing Library that click like a user.

## 10. Self-check

- [ ] Part A works uncontrolled **and** controlled, with `allowMultiple` on and off
- [ ] Panels keep their state when closed and when items are reordered
- [ ] The keyboard works and the accessibility tree shows expanded/collapsed
- [ ] I fixed all 4 Part B bugs and can name the concept behind each one
- [ ] I can explain my component in 60 seconds, out loud
- [ ] I tried at least one stretch goal

## Recap

- A reusable component = **configured by props**, **works with any content**, **reports changes with callbacks**, and **supports controlled and uncontrolled** use when it makes sense.
- Derive what you can (`isOpen`); keep **one** source of truth per mode; never copy a prop into state to "follow" it.
- Never call a handler during render (`onClick={fn()}`); never mutate state (`push`/`splice`); never use an index as the key of stateful items.
- `hidden` keeps content mounted (state survives); conditional rendering unmounts it.
- Accessible by default: native `<button>`, `aria-expanded`, `aria-controls`, `role="region"`.
