# Rate Limiter — Interview Prep Overview

Notes for the "design a rate limiter" system design interview. This
question is usually more algorithm-focused than most system design
problems — the core of the interview is comparing rate-limiting algorithms
precisely (their memory cost, accuracy, and burst behavior), then layering
on distributed-systems concerns (where state lives, how multiple servers
share limits).

## Contents

1. `01-token-bucket.md` — the token bucket algorithm: mechanics, burst
   handling, parameters.
2. `02-leaky-bucket.md` — the leaky bucket algorithm: mechanics, smoothing
   behavior, comparison to token bucket.
3. `03-sliding-window.md` — sliding window log and sliding window counter
   variants: accuracy vs. memory tradeoffs.
4. `04-fixed-window.md` — the fixed window counter algorithm: simplicity,
   the boundary-burst problem.
5. `05-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure, including
   distributed rate limiting (shared state across servers) as a common
   extension.

## How to use this

- These four algorithms solve the same problem with different tradeoffs
  along three axes: **memory usage**, **accuracy** (does it over/under-
  allow near window boundaries), and **burst behavior** (does it allow
  short bursts or strictly smooth traffic). Build a mental comparison table
  as you read — interviewers frequently ask you to pick one and defend it
  against the others directly.
- Fixed window and sliding-window-log are good "explain first, then
  critique" building blocks; token bucket, leaky bucket, and sliding-window
  counter are the ones most commonly used in real production systems and
  worth knowing in the most depth.
- The interview questions file includes distributed rate limiting (Redis-
  backed counters, race conditions, Lua scripting for atomicity) since
  almost every real interview extends the single-machine version into a
  distributed one.
