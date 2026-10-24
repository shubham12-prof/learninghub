# 06 - Mock Interview: Rapid Round, Scorecard and Final Plan

> **Time:** ~60 min | **Type:** Simulated interview | **Use after:** the recall tests (`01`, `02`) and the recorded answer (`05`)
> Do this with a friend, or alone with a timer and a voice recorder. If alone, read each question from the list, **start the timer, answer aloud**, then check the key points.

## 1. How the round works

| Part        | Time   | What                                                           |
| ----------- | ------ | -------------------------------------------------------------- |
| Warm-up     | 3 min  | "Tell me about yourself" (60 seconds)                          |
| Rapid round | 25 min | 10 questions, **90 seconds each** (3 min for the last)         |
| Coding      | 20 min | One problem **on a blank file** (use a round 2 pair from `03`) |
| Project     | 7 min  | "Walk me through LearningHub" (2 min) + 2 follow-ups           |
| Debrief     | 5 min  | Fill the scorecard                                             |

Rules: **no notes**, say the answer aloud, stop at the timer even in mid-sentence (real interviewers do), and pause 2 seconds before you start to organise your thoughts.

## 2. The rapid round (10 questions)

Each has the **key points** you should hit. Score 0 to 2 as in `01`/`02`.

| #   | Question                                                                            | Key points to hit                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Explain closures and give a real use.                                               | function + its lexical scope; remembers variables after the outer function returns; debounce/private state; the `var`-in-loop trap                                               |
| 2   | Explain the event loop; what is printed for `sync` / `setTimeout` / `Promise.then`? | call stack, queues, microtasks before macrotasks; order `sync`, `promise`, `timeout`                                                                                             |
| 3   | `Promise.all` vs `allSettled` vs `race` vs `any`; does `fetch` reject on 404?       | rejection behaviour of each; `fetch` doesn't reject on HTTP errors, check `res.ok`                                                                                               |
| 4   | When does a React component re-render? How do you avoid wasted renders?             | state, parent, context; move state down, `children`, `memo` + stable props; measure                                                                                              |
| 5   | `useEffect`: dependencies, cleanup, Strict Mode.                                    | runs after render; deps decide when; cleanup before next run/unmount; dev double-mount                                                                                           |
| 6   | CSR vs SSR vs SSG vs ISR; what is a Server Component?                               | where and when HTML is made; stale-while-revalidate; server components send no JS, can't use state/effects                                                                       |
| 7   | Type inference, `unknown` vs `any`, and why validate API data.                      | inferred from values; `const` keeps literals, `let` widens; types erased at runtime                                                                                              |
| 8   | Walk through a request from the browser to the database and back.                   | fetch, auth header, middleware chain, parameterised SQL, status code, UI update, error path, request id                                                                          |
| 9   | Explain JWT, its risks, and 401 vs 403.                                             | three parts, signed not encrypted, `verify` not `decode`, pin the algorithm, expiry/revocation; 401 = who are you, 403 = not allowed                                             |
| 10  | How do you handle errors, and when do you retry a failed request?                   | expected vs unexpected errors, consistent shape, generic 500 + request id; retry idempotent requests on network/5xx/429 with backoff and jitter; `POST` needs an idempotency key |

## 3. Scorecard

| Section                                                  | Max    | My score |
| -------------------------------------------------------- | ------ | -------- |
| Rapid round (10 x 2)                                     | 20     |          |
| Coding (`03` rubric, 0 to 5)                             | 5      |          |
| Project walkthrough (rubric in `05`, divide by 8, round) | 5      |          |
| Delivery: pace, fillers, ending                          | 5      |          |
| **Total**                                                | **35** |          |

**30+** = strong · **24 to 29** = good, fix the lowest section · **below 24** = repeat the weakest day's files, then re-run this round in 2 days.

## 4. Weak-spot tracker

| Topic | Day | Score this round | What I will do | Done |
| ----- | --- | ---------------- | -------------- | ---- |
|       |     |                  |                | [ ]  |
|       |     |                  |                | [ ]  |
|       |     |                  |                | [ ]  |

## 5. The final 24 hours

1. **Re-test only your weak spots** (from `01`, `02`, `06`). Don't learn new topics.
2. Re-do **one** coding problem from memory, then read the 30-second explanations aloud.
3. Say your **project pitch**, **one feature trace** and **three trade-offs** aloud, once.
4. Prepare **three questions to ask them**: the team's testing approach, how deployments and on-call work, what a good first 90 days looks like.
5. Set up: charger, quiet room, working microphone and camera, water, a pen and paper, the link and time (with the time zone) written down.
6. **Sleep.** A rested brain recalls better than another hour of cramming.

## 6. If you freeze in the real interview

- Breathe, then say: "Let me think about that for a moment."
- Restate the question in your own words: it buys time and checks you understood.
- Start from what you **do** know ("I know the general idea is...") and reason out loud.
- For coding: **clarify** (inputs, edge cases), give the **brute force** first, then improve it, and **test with an example** before saying you're done.
- It is fine to say "I'm not sure", then explain **how you would find out**.

## Recap

- A mock interview is **timed, spoken and unprepared**: that is what makes it useful.
- Score it, find the **two weakest topics**, fix only those.
- In the last 24 hours: **retrieve, don't re-read**; practise your pitch; rest.

## Checklist

- [ ] I did the rapid round aloud with a timer
- [ ] I filled in the scorecard and the weak-spot tracker
- [ ] I have three questions to ask the interviewer
- [ ] I know what I will do if I freeze
- [ ] I have a plan for the last 24 hours
