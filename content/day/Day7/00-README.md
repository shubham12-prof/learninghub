# Day 7: Revision, Mock Interview and Memory Test

> **Goal of the day:** find out what you **actually remember** from Days 1 to 6 (not what you recognise), fix the gaps, and practise **saying** your answers the way you will in the interview.
> **Time:** about 6 to 7 hours. **No new theory today.** Every task is retrieval practice: close the notes, produce the answer, then check.

## Daily target

| Target                                | Where                                             | Done when                                                                                                 |
| ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Recall test, no notes**             | `01-recall-days-1-3.md` + `02-recall-days-4-6.md` | 62 questions answered aloud; score 54+/60 for Days 1-3 and 58+/64 for Days 4-6 (or a written retest plan) |
| **Redo 2 problems without solutions** | `03-coding-redo-two-problems.md`                  | `debounce` (8 tests) and _longest substring_ (14 tests) pass, within 20 minutes each                      |
| **Explain LearningHub**               | `04-project-learninghub-architecture.md`          | a 2-minute overview, one feature traced end to end, 5 decisions with trade-offs, 3 limitations            |
| **Record a 3 to 5 minute answer**     | `05-english-mock-interview.md`                    | one recording (best of 3 takes) scored 28+/40 on the rubric                                               |
| **Full mock round + scorecard**       | `06-mock-interview-scorecard.md`                  | scorecard filled in, weak spots listed, 24-hour plan written                                              |

## Files (one topic per file)

| #   | File                                     | Type                                                                                  | Time   |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| 01  | `01-recall-days-1-3.md`                  | Memory test: JavaScript, async JS, React (30 questions)                               | 60 min |
| 02  | `02-recall-days-4-6.md`                  | Memory test: React performance + CSS, Next.js + TypeScript, full-stack (32 questions) | 60 min |
| 03  | `03-coding-redo-two-problems.md`         | Coding: timed redo of `debounce` and longest substring                                | 90 min |
| 04  | `04-project-learninghub-architecture.md` | Project: architecture, features, decisions, trade-offs                                | 75 min |
| 05  | `05-english-mock-interview.md`           | English: record a 3 to 5 minute answer                                                | 75 min |
| 06  | `06-mock-interview-scorecard.md`         | Mock interview round, scorecard, final plan                                           | 60 min |

## Suggested schedule

| Time   | Block                                     | Why this order                             |
| ------ | ----------------------------------------- | ------------------------------------------ |
| 1 h    | `01` recall Days 1-3                      | the oldest material fades first            |
| 1 h    | `02` recall Days 4-6                      |                                            |
| 15 min | **Break + re-read only your 0/1 answers** | targeted repair, not a full re-read        |
| 1.5 h  | `03` redo two problems                    | coding needs fresh focus                   |
| 1.25 h | `04` project explanation                  | you now remember the details to explain    |
| 1.25 h | `05` record the answer                    | speak after you have rehearsed the content |
| 1 h    | `06` mock round                           | the dress rehearsal                        |

## Why this works (short)

- **Retrieval practice**: trying to recall an answer strengthens memory far more than re-reading it. So every file asks first and answers **later**.
- **Spacing**: Day 7 revisits Days 1 to 6 after a delay; repeat the weak spots in 2 days and again in 7.
- **Speaking aloud**: interviews test explanation, not recognition. Saying it exposes the gaps silent reading hides.

## Cheat sheet: the 15 sentences to be able to say cold

1. **Closure**: a function that remembers the variables of the scope where it was created.
2. **`var`/`let`/`const`**: function vs block scope; `var` hoists as `undefined`; `let`/`const` have a dead zone; `const` stops reassignment, not mutation.
3. **Event loop**: sync code first, then **all microtasks** (promises), then the next **macrotask** (timers).
4. **`Promise.all`** rejects on the first failure; **`allSettled`** never rejects; **`race`** takes the first to settle; **`any`** the first success.
5. **`fetch`** doesn't reject on 404/500: check `res.ok`.
6. **`setCount(c => c + 1)`** uses the latest value; `setCount(count + 1)` uses a snapshot.
7. **`useEffect`**: runs after render; deps decide when; cleanup before the next run and on unmount.
8. **Re-render wasted?** Move state down, pass `children`, then `memo` with stable props. Measure first.
9. **Flexbox** is 1D, **Grid** is 2D; contrast needs **4.5:1**.
10. **SSG** at build, **SSR** per request, **ISR** = SSG + background refresh (stale-while-revalidate), **CSR** in the browser.
11. **Server Components** send no JS and can't use state; `"use client"` marks the boundary.
12. **Types vanish at runtime**: validate data from outside; `unknown` over `any`.
13. **401** = who are you, **403** = not allowed; **idempotent** = same state after repeats (GET, PUT, DELETE).
14. **JWT** = `header.payload.signature`; signed, **not encrypted**; always `verify`, pin the algorithm, keep it short-lived.
15. **Parameterised queries** stop SQL injection; retry only **idempotent** requests, with **backoff, jitter and `Retry-After`**.

## Final checklist for the week

- [ ] I scored my recall tests honestly and wrote down my weak spots
- [ ] I redid two problems without solutions, with a timer
- [ ] I can pitch LearningHub in 30 seconds and trace one feature in 7 steps
- [ ] I have a recorded 3 to 5 minute answer and I reviewed it
- [ ] I completed one mock round and have a plan for the last 24 hours
- [ ] I will re-test my weakest topics in 2 days
