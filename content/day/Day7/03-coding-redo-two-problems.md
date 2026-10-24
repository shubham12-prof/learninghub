# 03 - Coding: Redo Two Problems From Memory

> **Time:** ~90 min | **Type:** Timed retrieval practice | **Target:** 2 problems, no solutions open
> Both problems are ones you met earlier: `debounce` (Day 2) and _longest substring without repeating characters_ (Day 6). The tests below were run: every test fails on the empty starter, passes on the answer key (8 + 14 tests), and **fails on the classic wrong versions** (so they really check the thing that matters).

## 1. The rules (these make it work)

1. **Close Day 2 and Day 6 first.** No notes, no AI, no solution files, no web.
2. **Timer: 20 minutes per problem** (25 if you also write extra tests). Write the plan in comments first (2 minutes): inputs, outputs, edge cases, approach.
3. Write the code **by hand**. Run the tests only when you believe you are done. Count how many **runs** it takes.
4. When the timer ends, **stop**, even if the tests are red. Note where you got stuck. _That_ gap is what Day 7 is for.
5. Only then open the answer key (section 5), compare, and **close it again and rewrite the part you missed** from memory.
6. Say the **30-second explanation** aloud (section 4).

### Score each problem

|                                                              | Points |
| ------------------------------------------------------------ | ------ |
| All tests pass within 20 minutes                             | 3      |
| Passes, but needed more than 20 minutes                      | 2      |
| Right idea, bugs left                                        | 1      |
| Couldn't start                                               | 0      |
| **+1** if you stated the time and space complexity correctly | +1     |
| **+1** if you named the edge cases before the tests did      | +1     |

5 = solid. 3 to 4 = repeat in 2 days. 0 to 2 = redo that day's file, then retry tomorrow.

## 2. Setup (2 minutes)

```bash
mkdir day7-redo && cd day7-redo
echo '{ "type": "module" }' > package.json      # lets you use import/export
# create the 4 files below: debounce.js, debounce.test.js, longest-substring.js, longest-substring.test.js
node --test debounce.test.js
node --test longest-substring.test.js
```

Node 20 or later is enough (no installs). The debounce tests use Node's **fake timers**, so they finish instantly and never wait for real time.

## 3. Problem 1: `debounce(fn, delay)` (Day 2)

Return a function that, when called, waits until `delay` ms have passed **since the last call** and only then runs `fn` with the **last call's arguments** and the right `this`. Each call restarts the wait. Two debounced functions must not share a timer.

**Optional bonus:** add `.cancel()` that drops a pending call (run the bonus test with `BONUS=1 node --test debounce.test.js`).

`debounce.js` (starter)

```js
// Redo #1: write debounce(fn, delay) here. Do NOT open Day 2 (06-coding-debounce.md) until the 20 minutes are over.
export function debounce(fn, delay) {
  // your code
}
```

`debounce.test.js`

```js
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test, mock } from "node:test";
import { debounce } from "./debounce.js";

beforeEach(() => mock.timers.enable({ apis: ["setTimeout"] }));
afterEach(() => mock.timers.reset());

describe("debounce: the core behaviour", () => {
  test("does not run immediately", () => {
    const calls = [];
    debounce((x) => calls.push(x), 100)("a");
    assert.deepEqual(calls, []);
  });

  test("runs once after the delay, with the arguments", () => {
    const calls = [];
    const d = debounce((...args) => calls.push(args), 100);
    d("a", 1);
    mock.timers.tick(100);
    assert.deepEqual(calls, [["a", 1]]);
  });

  test("a burst of calls runs only the LAST one", () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 100);
    d(1);
    d(2);
    d(3);
    mock.timers.tick(100);
    assert.deepEqual(calls, [3]);
  });

  test("each new call restarts the timer", () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 100);
    d("first");
    mock.timers.tick(60);
    d("second"); // restart: must now wait a full 100 ms again
    mock.timers.tick(60);
    assert.deepEqual(calls, [], "only 60 ms since the last call");
    mock.timers.tick(40);
    assert.deepEqual(calls, ["second"]);
  });

  test("calls spaced further apart than the delay all run", () => {
    const calls = [];
    const d = debounce((x) => calls.push(x), 50);
    d(1);
    mock.timers.tick(50);
    d(2);
    mock.timers.tick(50);
    assert.deepEqual(calls, [1, 2]);
  });
});

describe("debounce: this, independence", () => {
  test("keeps `this`", () => {
    const seen = [];
    const obj = {
      name: "obj",
      hello: debounce(function () {
        seen.push(this.name);
      }, 10),
    };
    obj.hello();
    mock.timers.tick(10);
    assert.deepEqual(seen, ["obj"]);
  });

  test("two debounced functions do not share a timer", () => {
    const calls = [];
    const a = debounce(() => calls.push("a"), 100);
    const b = debounce(() => calls.push("b"), 100);
    a();
    b();
    mock.timers.tick(100);
    assert.deepEqual(calls.sort(), ["a", "b"]);
  });

  test("returns a function", () => {
    assert.equal(typeof debounce(() => {}, 10), "function");
  });
});

describe(
  "BONUS (optional): cancel()",
  { skip: process.env.BONUS ? false : "set BONUS=1 to run" },
  () => {
    test("cancel() stops the pending call", () => {
      const calls = [];
      const d = debounce(() => calls.push("x"), 100);
      d();
      d.cancel();
      mock.timers.tick(200);
      assert.deepEqual(calls, []);
    });
  },
);
```

Before you code, answer: _What must live outside the returned function? Why a regular `function` and not an arrow? What does `clearTimeout` do here?_

## 3b. Problem 2: Longest substring without repeating characters (Day 6)

Given a string `s`, return the **length** of the longest substring that has no repeated character. `"abcabcbb"` is `3` (`"abc"`), `"bbbbb"` is `1`, `"pwwkew"` is `3` (`"wke"`, not `"pwke"`: a substring is contiguous). Target: **O(n)**.

`longest-substring.js` (starter)

```js
// Redo #2: write lengthOfLongestSubstring(s) here. Do NOT open Day 6 (05-coding-dsa-problem.md) until the 20 minutes are over.
export function lengthOfLongestSubstring(s) {
  // your code
}
```

`longest-substring.test.js`

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { lengthOfLongestSubstring } from "./longest-substring.js";

const cases = [
  ["abcabcbb", 3],
  ["bbbbb", 1],
  ["pwwkew", 3],
  ["", 0],
  ["a", 1],
  ["au", 2],
  ["dvdf", 3],
  ["abba", 2],
  ["tmmzuxt", 5],
  [" ", 1],
  ["a b a", 3],
  ["aab", 2],
];

describe("longest substring without repeating characters", () => {
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} -> ${expected}`, () =>
      assert.equal(lengthOfLongestSubstring(input), expected));
  }
  test("100,000 characters finishes quickly (needs O(n))", () => {
    const start = performance.now();
    assert.equal(lengthOfLongestSubstring("abcdefghij".repeat(10_000)), 10);
    assert.ok(
      performance.now() - start < 200,
      "too slow: is it O(n^2) or worse?",
    );
  });
  test("3,000 DIFFERENT characters finishes quickly (nested loops with includes are too slow here)", () => {
    const s = Array.from({ length: 3000 }, (_, i) =>
      String.fromCharCode(0x4e00 + i),
    ).join(""); // all distinct
    const start = performance.now();
    assert.equal(lengthOfLongestSubstring(s), 3000);
    assert.ok(
      performance.now() - start < 200,
      "too slow: is it O(n^2) or worse?",
    );
  });
});
```

Before you code, answer: _What does the window contain? When does `left` move? Why can't `left` ever move backwards? What are the traps in `"dvdf"` and `"abba"`?_

## 4. Say it aloud (30 seconds each)

**Debounce:** "Debounce returns a wrapper that delays calling the original until `delay` ms pass with no new calls. The timer id lives in a closure; every call clears the previous timer and starts a new one, so the function only runs once the calls stop. I use a regular function plus `apply` so `this` and all arguments are preserved. It suits search inputs and resize handlers; throttle is the one that limits a _continuous_ stream to once per interval."

**Longest substring:** "I use a sliding window with a set of the characters inside it. I move `right` one step at a time; if the new character is already in the window, I shrink from the left, deleting characters, until the duplicate is gone, then add it and update the best length. Each character enters and leaves the window at most once, so it is O(n) time and O(k) space for the set. The brute force checks every substring and is O(n^3)."

## 5. Answer key (STOP: only after the timer has ended)

### `debounce.js`

```js
export function debounce(fn, delay) {
  let timerId; // lives in the closure

  function debounced(...args) {
    clearTimeout(timerId); // restart the wait
    timerId = setTimeout(() => {
      fn.apply(this, args); // arrow: keeps `this` and `args`
    }, delay);
  }

  debounced.cancel = () => clearTimeout(timerId); // bonus
  return debounced;
}
```

Mistakes the tests catch:

| Wrong version                                                                  | Which test fails                                                     | Why                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `return (...args) => setTimeout(() => fn(...args), delay)` (no `clearTimeout`) | "a burst runs only the LAST one", "each new call restarts the timer" | it just **delays** every call; nothing is cancelled                      |
| the returned function is an **arrow** and uses `fn.apply(this, args)`          | "keeps `this`"                                                       | an arrow has no `this` of its own, so `this` is the outer one            |
| `let timerId` declared **inside** the returned function                        | the burst and restart tests                                          | each call gets a fresh `timerId`, so the previous timer can't be cleared |

### `longest-substring.js`

```js
export function lengthOfLongestSubstring(s) {
  const seen = new Set(); // characters inside the current window
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      // shrink from the left until the duplicate is gone
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

Mistakes (both checked by running them):

| Wrong version                                                      | Result                                                                                                                                              | Why                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| on a duplicate, clear the set and restart at the current character | `"dvdf"` gives **2** (expected 3)                                                                                                                   | the valid window `"vdf"` starts _after_ the first `d`, not at the second `d`   |
| Map-of-last-index version **without** the `>= left` guard          | `"abba"` gives **3** (expected 2)                                                                                                                   | `left` jumps **backwards** to a stale index                                    |
| two nested loops that build a string and call `includes`           | passes the first 13 tests (even the 100,000-character one, because it stops at the first repeat), but **fails the 3,000-different-characters test** | O(n^2) loops with an O(n) `includes` inside: far too slow when nothing repeats |

## 6. Round 2: swap in a different pair (do this tomorrow, or if you scored 5)

| Pick | Problem                                 | Where you saw it                            | Hint (pattern)                                            |
| ---- | --------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| A    | Flatten a nested array                  | Day 2 `07-coding-flatten-array.md`          | recursion or an explicit stack; edge: empty arrays, depth |
| B    | Remove duplicates (keep first)          | Day 1 `07-coding-remove-duplicates.md`      | `Set`; objects need a key                                 |
| C    | Frequency counter / valid anagram       | Day 1 `08-coding-frequency-counter.md`      | `Map`; compare counts                                     |
| D    | Two Sum                                 | Day 6 `05-coding-dsa-problem.md` (variants) | one pass, `Map` of value to index                         |
| E    | Reverse a string (and the Unicode trap) | Day 1 `06-coding-reverse-a-string.md`       | two pointers, `[...str]`                                  |

## 7. Common mistakes during a timed redo

1. **Peeking** "just to check the syntax". The struggle is the learning.
2. Starting to type before deciding the approach and the edge cases.
3. Not running the tests until the end, then facing 6 failures at once. Run after each small step.
4. Forgetting empty input, one element, repeated elements and very large input.
5. Fixing a failing test by special-casing its input instead of understanding the bug.
6. Memorising the code instead of the **idea** (closure + timer; window + two pointers).

## Recap

- **Debounce** = closure + `clearTimeout` + `setTimeout`, regular function for `this`, `apply` for arguments.
- **Sliding window** = two pointers that only move forward, a set for the window, shrink while invalid, track the best: **O(n)**.
- A redo is only useful **without the solution**, with a **timer**, and with the gap **written down**.

## Checklist

- [ ] I did both problems with Day 2 and Day 6 closed
- [ ] I noted my time, my number of test runs and where I got stuck
- [ ] I rewrote the part I missed from memory
- [ ] I stated the complexity of both, and the edge cases, aloud
- [ ] I picked my round 2 pair
