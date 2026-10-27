# Day 8: DSA Patterns and Behavioral Interview Skills

> **Goal of the day:** learn to **recognise the five most common coding-interview patterns** instead of memorising answers, and prepare the **behavioral half** of the interview (STAR stories), practised aloud in English.
> **Time:** about 8 hours at a steady pace.
> **Verified with:** Node 22 `node:test`. Pattern solutions: 12 + 19 + 21 + 8 + 11 = **71 tests passing**, and each pattern has a "wrong version" check that fails the intended test.

## Daily target: 5 pattern problems + 5 behavioral answers

| Target                                   | Where                                     | Done when                                                                                               |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **5 DSA problems, one per pattern**      | `02` to `06`                              | hash set, two pointers, stack, recursion, binary search: each solved from memory with its tests passing |
| **The framework**                        | `01-how-to-solve-coding-problems.md`      | you can say the 7 steps and map a problem to a pattern from its signals                                 |
| **5 behavioral stories**                 | `07-interview-behavioral-star.md`         | 5 real stories written as STAR bullets; "tell me about yourself" and "why us" ready                     |
| **5 recorded answers (60 to 90 s each)** | `08-english-record-behavioral-answers.md` | recorded, reviewed with the checklist, best takes kept                                                  |

## Files (one topic per file)

| #   | File                                      | Type                                                             | Time   |
| --- | ----------------------------------------- | ---------------------------------------------------------------- | ------ |
| 01  | `01-how-to-solve-coding-problems.md`      | Skill: 7-step framework, Big-O, pattern signals, JS gotchas      | 50 min |
| 02  | `02-pattern-hash-map-set.md`              | Coding: Longest Consecutive Sequence (+ Two Sum, First Unique)   | 70 min |
| 03  | `03-pattern-two-pointers.md`              | Coding: Container With Most Water (+ Palindrome, Two Sum sorted) | 70 min |
| 04  | `04-pattern-stack.md`                     | Coding: Valid Parentheses, Daily Temperatures (+ RPN)            | 70 min |
| 05  | `05-pattern-recursion-backtracking.md`    | Coding: Subsets (+ Permutations, memoised Fibonacci)             | 75 min |
| 06  | `06-pattern-binary-search.md`             | Coding: Binary Search, First True, Square Root                   | 70 min |
| 07  | `07-interview-behavioral-star.md`         | Interview: STAR, core questions, salary, questions to ask        | 90 min |
| 08  | `08-english-record-behavioral-answers.md` | English: record 5 answers                                        | 90 min |

## Suggested study order

1. **`01` (50 min):** read the framework once. You will use it in every pattern file.
2. **Each pattern file (`02` to `06`), same routine (about 70 minutes each):**
   1. Read **only** the idea and the problem statement.
   2. **Try it for 20 minutes** in your own file (use the tests from the doc; run `node --test`).
   3. Read the thinking section and the solution; **close it and rewrite** from memory.
   4. Answer the **Predict the output** questions, then say the 30-second explanation aloud.
3. **`07` (90 min):** write your 5 stories first, **then** read the model answers (not the other way round, or you will copy them).
4. **`08` (90 min):** record, review, fix, re-record.
5. **Last 15 minutes:** the cheat sheet below.

## Setup

```bash
mkdir day8 && cd day8
echo '{ "type": "module" }' > package.json         # use import/export, no installs needed
# copy a pattern's solution file and its test file from the doc, e.g. hash-set.js + hash-set.test.js
node --test hash-set.test.js                        # Node 20 or later
```

For practice, create an **empty** solution file with the same exported names, run the tests (they fail), then write the solution until they pass.

## Cheat sheet: patterns at a glance

| Pattern                      | Signal                                           | Core move                                             | Time / space    | Day 8 file |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------- | --------------- | ---------- |
| **Hash map / set**           | "seen before?", counting, pairs, unsorted + O(n) | store in a `Map`/`Set`, look up in O(1)               | O(n) / O(n)     | `02`       |
| **Two pointers**             | sorted array, pair/triple, palindrome, in place  | move two indexes by a rule that discards options      | O(n) / O(1)     | `03`       |
| **Sliding window** (Day 6)   | contiguous subarray/substring                    | grow right; shrink left while invalid                 | O(n) / O(k)     | Day 6 `05` |
| **Stack**                    | brackets, "most recent first", next greater      | push, pop when resolved; monotonic stack of indices   | O(n) / O(n)     | `04`       |
| **Recursion / backtracking** | all subsets/permutations, smaller copy           | choose, explore, un-choose; **copy** results; memoize | O(2^n) or O(n!) | `05`       |
| **Binary search**            | sorted, or yes/no flips once, huge n             | halve the range; template B "first true"              | O(log n) / O(1) | `06`       |

**Framework:** clarify → example → brute force → bottleneck → code → test → complexity. **Say the brute force first.**

**STAR:** Situation (15%) → Task (15%) → **Action (50%)** → Result (15%) → Lesson (5%). 60 to 90 seconds, "I", past tense, one number.

## Final checklist for the day

- [ ] I can recite the 7-step framework and the pattern signals
- [ ] I solved all five pattern problems from memory (tests pass)
- [ ] I can state the time and space complexity of each
- [ ] I wrote 5 real STAR stories and a 60-second "tell me about yourself"
- [ ] I recorded 5 answers and fixed 3 things on each weak one
- [ ] I will redo the two hardest patterns in 3 days (spaced repetition)
