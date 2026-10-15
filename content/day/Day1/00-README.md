# Day 1: JavaScript Fundamentals

Welcome! This folder has **one file per topic** so you can learn each idea on its own, revise it quickly, and tick it off.

## What's inside

| # | File | Type | Time | Done |
|---|---|---|---|---|
| 01 | `01-scope.md` | Theory | 25 min | [ ] |
| 02 | `02-hoisting.md` | Theory | 25 min | [ ] |
| 03 | `03-closures.md` | Theory | 35 min | [ ] |
| 04 | `04-this-keyword.md` | Theory | 35 min | [ ] |
| 05 | `05-execution-context.md` | Theory | 30 min | [ ] |
| 06 | `06-coding-reverse-a-string.md` | Coding | 25 min | [ ] |
| 07 | `07-coding-remove-duplicates.md` | Coding | 30 min | [ ] |
| 08 | `08-coding-frequency-counter.md` | Coding | 30 min | [ ] |
| 09 | `09-interview-var-let-const.md` | Interview | 30 min | [ ] |
| 10 | `10-interview-closures.md` | Interview | 35 min | [ ] |
| 11 | `11-project-learninghub.md` | Project | 90 min | [ ] |

**Total:** about 6 to 6.5 hours. You can split it into 2 or 3 sessions.

## Suggested study order

The theory files are numbered by topic, but this order makes the ideas click fastest:

1. **`01-scope.md`**: where variables can be seen.
2. **`05-execution-context.md`**: how JavaScript actually runs your code (this explains *why* the next topics behave as they do).
3. **`02-hoisting.md`**: what happens during the creation phase.
4. **`03-closures.md`**: functions remembering their scope.
5. **`04-this-keyword.md`**: who is calling the function.
6. **`06`, `07`, `08`**: coding practice. Try each problem **yourself first** before reading the solutions.
7. **`09`, `10`**: interview answers. Say the 30-second answers out loud.
8. **`11`**: build and debug the LearningHub interaction.

## How to use each file

Every file follows the same pattern, so you always know where to look:

- **Theory files:** explanation -> analogy -> examples -> common mistakes -> **Predict the output** -> answers -> recap -> checklist.
- **Coding files:** problem -> several solutions (simple to optimal) with complexity -> edge cases -> **practice variations** -> hints -> recap -> checklist.
- **Interview files:** a **30-second answer** -> deeper explanation -> follow-up questions -> trick questions -> answers -> checklist.
- **Project file:** setup -> build -> debug -> solutions -> stretch goals.

### The learning loop (works for every file)

1. **Read** the explanation (don't skim the analogy, it makes the idea stick).
2. **Type the examples yourself**: don't copy-paste. Change a value and predict what happens.
3. **Cover the answers** and attempt every "Predict the output" question.
4. **Explain it out loud** as if teaching a friend. If you get stuck, re-read that section.
5. **Tick the checklist** at the bottom of the file.

## How to run the code

- **Browser:** press `F12` -> **Console** tab -> paste the snippet.
- **Node.js:** save the snippet as `test.js` and run `node test.js`.
- Note: some snippets are *meant* to throw an error (the comment says so). Run those one at a time.

## Day 1 goals

By the end of today you should be able to:

- [ ] Explain scope, hoisting, closures, `this` and execution context in plain English
- [ ] Predict the output of tricky `var` / `let` / `const` / hoisting snippets
- [ ] Write reverse-string, remove-duplicates and frequency-counter solutions from memory, in more than one way
- [ ] Give a clear 30-second answer for `var` vs `let` vs `const` and for closures
- [ ] Fix a real bug that comes from a lost `this`, a `var` loop or the TDZ

## Quick-revision cheat sheet

| Topic | One-line memory hook |
|---|---|
| Scope | Inner can see outer, never the other way round |
| Hoisting | Declarations are registered first; `var` = `undefined`, `let/const` = TDZ, functions = ready |
| Closure | Function + the backpack of variables it was born with |
| `this` | Decided by **how** it's called (arrow functions: **where** it's written) |
| Execution context | Creation phase (memory) then execution phase (run), managed by the call stack |
| `var` / `let` / `const` | function scope / block scope / block scope + no reassign |
| Reverse string | `[...str].reverse().join("")` |
| Remove duplicates | `[...new Set(arr)]` |
| Frequency counter | `count[x] = (count[x] || 0) + 1` (or use a `Map`) |

Good luck! Take it one file at a time.
