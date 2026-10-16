# Day 2: Advanced JavaScript (Asynchronous JavaScript)

Same format as Day 1: **one file per topic**, so you can learn each idea on its own, revise it quickly and tick it off.

## Today's target

> **1 coding problem + 5 interview questions + 1 API exercise**

| | What | Where | Done |
|---|---|---|---|
| **1 problem** | Implement `debounce` **or** flatten a nested array (do the other as a bonus) | `06-coding-debounce.md` or `07-coding-flatten-array.md` | [ ] |
| **Question 1** | "Explain the event loop. What is the difference between microtasks and macrotasks?" | `03-event-loop.md` + `04-microtasks.md` | [ ] |
| **Question 2** | "What is the output?" (async/await + `setTimeout` + promises) | `10-interview-event-loop-output.md` (P3 and P11) | [ ] |
| **Question 3** | "Explain `Promise.all`. What if one promise rejects? How is it different from `allSettled`, `race` and `any`?" | `08-interview-promise-all.md` | [ ] |
| **Question 4** | "How do you handle errors in async code? Does `fetch` reject on a 404?" | `09-interview-error-handling.md` | [ ] |
| **Question 5** | "`async/await`: sequential vs parallel. Why doesn't `forEach(async ...)` work?" | `02-async-await.md` | [ ] |
| **1 API exercise** | Build the Instructors page: fetch, loading, empty, error, retry, timeout, search | `11-project-api-fetching.md` | [ ] |

**How to count a question as "done":** you answered it **out loud in under 60 seconds**, using the 30-second answer in the file as your model, and you can answer the follow-up questions listed there.

## What's inside

| # | File | Type | Time | Done |
|---|---|---|---|---|
| 01 | `01-promises.md` | Theory | 35 min | [ ] |
| 02 | `02-async-await.md` | Theory | 35 min | [ ] |
| 03 | `03-event-loop.md` | Theory | 40 min | [ ] |
| 04 | `04-microtasks.md` | Theory | 30 min | [ ] |
| 05 | `05-closures-review.md` | Theory (review) | 30 min | [ ] |
| 06 | `06-coding-debounce.md` | Coding | 40 min | [ ] |
| 07 | `07-coding-flatten-array.md` | Coding | 35 min | [ ] |
| 08 | `08-interview-promise-all.md` | Interview | 40 min | [ ] |
| 09 | `09-interview-error-handling.md` | Interview | 40 min | [ ] |
| 10 | `10-interview-event-loop-output.md` | Interview | 45 min | [ ] |
| 11 | `11-project-api-fetching.md` | Project | 90 min | [ ] |

**Everything:** about 7.5 hours (split it over 2 sessions if you like).
**Just the daily target:** about 5 hours (01 to 04, one coding file, 08 to 10, and the project).

## Suggested study order

1. **`01-promises.md`**: the building block everything else uses.
2. **`02-async-await.md`**: the modern way to write promises (covers Question 5).
3. **`03-event-loop.md`**: why async code runs when it does.
4. **`04-microtasks.md`**: the detail that decides "what is the output?" questions.
5. **`05-closures-review.md`**: closures in timers, requests and caches (you will need this for debounce and the API project).
6. **`06` and/or `07`**: coding practice. Try **yourself first**, then read the solutions.
7. **`08`, `09`, `10`**: the interview answers. Say the 30-second answers out loud.
8. **`11`**: build, break and fix the API page.

## How to use each file

Same pattern as Day 1, so you always know where to look:

- **Theory files:** explanation -> analogy -> examples -> common mistakes -> **Predict the output** -> answers -> recap -> checklist.
- **Coding files:** problem -> several solutions with complexity -> edge cases -> **practice variations** -> hints -> recap -> checklist.
- **Interview files:** a **30-second answer** -> deeper explanation -> follow-up questions -> trick questions -> answers -> checklist.
- **Project file:** setup -> requirements -> starter -> solution -> **test every failure** -> debug a broken version -> stretch goals.

### The learning loop

1. **Read** the explanation.
2. **Type the examples yourself** (don't paste) and change values.
3. **Predict the output first**, *then* run it. Every async bug is a wrong prediction about ordering.
4. **Explain it out loud** as if teaching a friend.
5. **Tick the checklist** at the end of each file.

## How to run the code

- **Browser:** `F12` -> **Console** and paste the snippet. (Needed for the DOM project.)
- **Node.js 18+:** save the snippet as `test.js` and run `node test.js`. Node 18+ has `fetch`, `AbortController` and `queueMicrotask` built in.
- Snippets that use `await` at the top level work in the browser console and in `.mjs` files. In a normal `.js` file for Node, wrap them in `(async () => { ... })();`.
- Some snippets are *meant* to throw (the comment says so). Run those one at a time.
- The helper `sleep` is used everywhere:
  ```js
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  ```

## Quick-revision cheat sheet

| Topic | One-line memory hook |
|---|---|
| Promise | `pending -> fulfilled \| rejected`, settles **once**; executor is sync, `.then` is async |
| `.then` chain | Return a value or promise to pass it on; a throw skips to the next `.catch` |
| `async/await` | `async` returns a promise; `await` pauses **that function**, not the program |
| Parallel | Independent tasks -> `Promise.all`; dependent tasks -> `await` in sequence |
| `forEach(async)` | Doesn't wait. Use `for...of` or `Promise.all(arr.map(...))` |
| Event loop | Sync code -> **all** microtasks -> (render) -> **one** macrotask -> repeat |
| Microtasks | `.then/.catch/.finally`, code after `await`, `queueMicrotask` |
| Macrotasks | `setTimeout`, `setInterval`, I/O, UI events |
| `Promise.all` | All fulfil -> array in input order; any rejects -> reject immediately |
| `allSettled / race / any` | wait for all outcomes / first to settle / first success |
| `fetch` errors | Rejects **only** on network failure; check `res.ok` for 404/500 |
| Timeout / cancel | `AbortController` + `setTimeout`; clear the timer in `finally` |
| Stale responses | Closure request id: `if (myId !== latestId) return` |
| Debounce | `timerId` in a closure; `clearTimeout` + `setTimeout` on every call |
| Flatten | Recurse on `Array.isArray(item)`, or use a stack; `arr.flat(Infinity)` |

## Day 2 goals

By the end of today you should be able to:

- [ ] Explain promises, `async/await`, the event loop and microtasks in plain English
- [ ] Predict the output of event-loop puzzles with promises, `await` and timers
- [ ] Write `debounce` (and/or `flatten`) from memory, in more than one way
- [ ] Explain `Promise.all` and implement it by hand
- [ ] Handle errors, timeouts and retries around `fetch` without leaving a rejection unhandled
- [ ] Build a UI that handles loading, success, empty and error states, plus stale responses

Good luck! Take it one file at a time.
