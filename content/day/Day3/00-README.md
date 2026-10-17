# Day 3: React Fundamentals

Same format as Days 1 and 2: **one file per topic**, so you can learn each idea on its own, revise it quickly and tick it off.

## Today's target

> **1 working component + 5 answers**

| | What | Where | Done |
|---|---|---|---|
| **1 working component** | Build the **searchable list with filters** (or the counter with filters) and run it in a Vite app | `06-coding-searchable-list.md` | [ ] |
| **Answer 1** | "Explain `useState`. Why doesn't `setCount(count + 1)` three times add 3?" | `07-interview-usestate.md` | [ ] |
| **Answer 2** | "Explain `useEffect` and the dependency array. What is cleanup for?" | `08-interview-useeffect.md` | [ ] |
| **Answer 3** | "What are keys, and why is the array index a bad key?" | `09-interview-keys-rerendering.md` | [ ] |
| **Answer 4** | "When does a component re-render, and how do you avoid unnecessary re-renders?" | `09-interview-keys-rerendering.md` + `03-rendering.md` | [ ] |
| **Answer 5** | "Controlled vs uncontrolled components? Props vs state?" | `05-controlled-components.md` + `01-props.md` | [ ] |
| **Bonus (project)** | Build a **reusable `Accordion`** and fix the broken version | `10-project-reusable-component.md` | [ ] |

**How to count an answer as "done":** you said it **out loud in under 60 seconds**, using the 30-second answer in the file as your model, and you can handle the follow-up questions listed there.

## What's inside

| # | File | Type | Time | Done |
|---|---|---|---|---|
| 01 | `01-props.md` | Theory | 30 min | [ ] |
| 02 | `02-state.md` | Theory | 40 min | [ ] |
| 03 | `03-rendering.md` | Theory | 40 min | [ ] |
| 04 | `04-hooks.md` | Theory | 45 min | [ ] |
| 05 | `05-controlled-components.md` | Theory | 40 min | [ ] |
| 06 | `06-coding-searchable-list.md` | Coding | 75 min | [ ] |
| 07 | `07-interview-usestate.md` | Interview | 35 min | [ ] |
| 08 | `08-interview-useeffect.md` | Interview | 45 min | [ ] |
| 09 | `09-interview-keys-rerendering.md` | Interview | 45 min | [ ] |
| 10 | `10-project-reusable-component.md` | Project | 90 min | [ ] |

**Everything:** about 7.5 hours (split it over 2 sessions if you like).
**Just the daily target:** about 4.5 hours (01, 02, 03, 05, 06, 07, 08, 09; skim 04 and skip 10 if you're short on time).

## Suggested study order

1. **`01-props.md`**: inputs of a component.
2. **`02-state.md`**: remembered data, snapshots, immutability.
3. **`03-rendering.md`**: what a render is, and why components re-render.
4. **`05-controlled-components.md`**: forms (you need this for the searchable list).
5. **`04-hooks.md`**: `useRef`, `useMemo`, `useCallback`, context, reducers, custom hooks.
6. **`06-coding-searchable-list.md`**: **build it yourself first**, then compare with the solution.
7. **`07`, `08`, `09`**: the interview answers. Say the 30-second answers out loud.
8. **`10-project-reusable-component.md`**: build, test and debug the Accordion.

## Setting up (once)

You need Node.js 18+ and a terminal.

```bash
npm create vite@latest learninghub-day3 -- --template react
cd learninghub-day3
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Files you edit live in `src/`. Edit `src/App.jsx` and save: the page updates instantly.

The snippets in the theory files are **fragments**: to try one, paste it into `src/App.jsx` (add `import { useState } from "react";` at the top and export the component). The files `06` and `10` give you **complete files** to copy.

## How to use each file

Same pattern as Days 1 and 2:

- **Theory files:** explanation -> analogy -> examples -> common mistakes -> **Predict the output** -> answers -> recap -> checklist.
- **Coding file:** problem -> how to think -> setup -> full solution -> why it's written that way -> edge cases -> **practice variations** -> hints.
- **Interview files:** a **30-second answer** -> deeper explanation -> follow-up questions -> traps -> predict the output -> answers.
- **Project file:** API of the component -> starter -> solution -> test it -> debug a broken version -> stretch goals.

### The learning loop

1. **Read** the explanation.
2. **Type the examples yourself** and change values.
3. **Predict what the screen will show** *before* you run it. React bugs are almost always a wrong prediction about **when** things render.
4. **Explain it out loud** as if teaching a friend.
5. **Tick the checklist** at the end of each file.

## Quick-revision cheat sheet

| Topic | One-line memory hook |
|---|---|
| Props | Read-only inputs, parent to child; callbacks go child to parent |
| State | Remembered data; **a snapshot per render**; setter schedules a re-render |
| Updater function | Next state depends on previous? `setX(prev => ...)` |
| Immutability | New arrays/objects, never `push`/`splice`/`obj.x = ...` on state |
| Derived data | Calculate during render; never store what you can compute |
| Rendering | Render (call the function) -> commit (apply only the DOM differences) |
| Re-render causes | Own state, parent re-render, context change |
| `memo` | Skips re-render if props are shallow-equal; inline functions/objects defeat it |
| Hooks rules | Top level only, same order every render, only in components/hooks |
| `useEffect` | Sync with the outside world; none = every render, `[]` = mount, `[a]` = when `a` changes; **cleanup** undoes setup |
| Effects to avoid | Derived state, user-action logic, resetting state (use `key`) |
| Keys | Stable, unique among siblings, from your data; never `index` for dynamic lists, never random |
| `key` change | Remounts the component with fresh state |
| Controlled input | `value` + `onChange`: React state is the single source of truth |
| Uncontrolled input | `defaultValue` + `ref`/`FormData`: the DOM owns the value |
| `useRef` | Mutable box that does **not** re-render (DOM nodes, timer ids) |
| Strict Mode (dev) | Renders twice, effect -> cleanup -> effect, to expose impure code |

## Day 3 goals

By the end of today you should be able to:

- [ ] Explain props, state, rendering, hooks and controlled components in plain English
- [ ] Build a searchable, filterable list with controlled inputs and **derived** data
- [ ] Give clear 30-second answers on `useState`, `useEffect`, keys and re-rendering
- [ ] Explain why mutating state, using index keys and copying props into state cause bugs
- [ ] Write a reusable component that works controlled and uncontrolled

Good luck! Take it one file at a time.
