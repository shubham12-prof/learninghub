# 05 - Pattern 4: Recursion, Backtracking and Memoization (Subsets)

> **Time to learn:** ~75 min | **Level:** Coding | **Interview frequency:** High
> Tests: **8 passing**. A version that forgets to **copy** the current path fails 4 tests. The slow Fibonacci takes about 1.1 seconds for `n = 40` on this machine; the memoised one is instant.

## 1. The one idea

**Recursion** solves a problem by solving a **smaller copy** of it, with a **base case** that stops. **Backtracking** is recursion that builds an answer step by step: **choose** an option, **explore** what follows, then **un-choose** (undo) and try the next option. **Memoization** stores the results of sub-problems so the same one is never solved twice.

## 2. Analogy

Exploring a maze with chalk. At each fork you pick a path and mark it (choose), walk on (explore), and if you must come back, you rub out the mark (un-choose) and take the next path.

## 3. Template

```js
function solve(input) {
  const results = [];
  const path = [];

  function explore(state) {
    if (/* path is a complete answer */) { results.push([...path]); return; }   // base case; COPY the path
    for (const option of optionsFrom(state)) {
      path.push(option);          // choose
      explore(nextState(state));  // explore
      path.pop();                 // un-choose
    }
  }
  explore(initialState);
  return results;
}
```

Every recursion needs: (1) a **base case**, (2) a call on a **smaller** input, (3) a clear idea of what is **shared** between calls (the `path` array: that is why you undo and copy).

## 4. The problem: Subsets

Given an array of **distinct** numbers, return **all possible subsets** (the power set).

```
[1, 2, 3]  ->  [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]      8 subsets = 2^3
[]  ->  [[]]        the empty set has exactly ONE subset: the empty set
```

## 5. How to think about it

1. For each element there are **two choices**: in or out. With `n` elements that is `2^n` subsets, so any solution is at least O(2^n).
2. Think of a **decision tree**. Every node (every path from the root) is itself a valid subset, so record it **at every step**, not only at the leaves.
3. To avoid duplicates (`[1,2]` and `[2,1]`), only consider elements **after** the last one chosen: loop from `start`, and recurse with `i + 1`.
4. `path` is one array shared by all calls, so when you save a result you must save a **copy** (`[...path]`). If you push `path` itself, every result ends up pointing at the same array.

## 6. Solutions

```js
// Pattern 4: recursion and backtracking. Solve a problem by solving a smaller copy of it. "Choose, explore, un-choose."

/** All subsets (the power set). 2^n results, so O(n * 2^n) time. */
export function subsets(nums) {
  const result = [];
  const current = [];

  function explore(start) {
    result.push([...current]); // every path through the tree is a valid subset: record a COPY
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]); // choose
      explore(i + 1); // explore (only later items: no duplicates)
      current.pop(); // un-choose (backtrack)
    }
  }
  explore(0);
  return result;
}

/** All permutations. n! results. */
export function permutations(nums) {
  const result = [];
  const current = [];
  const used = new Array(nums.length).fill(false);

  function explore() {
    if (current.length === nums.length) {
      result.push([...current]);
      return;
    } // base case
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(nums[i]);
      explore();
      current.pop();
      used[i] = false;
    }
  }
  explore();
  return result;
}

/** Fibonacci with memoization (a closure over a Map). O(n) instead of O(2^n). Exact up to n = 78 (beyond that a double loses precision). */
export function fib(n, memo = new Map()) {
  if (n < 2) return n; // base cases
  if (memo.has(n)) return memo.get(n);
  const value = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, value);
  return value;
}

/** The slow version, for comparison: O(2^n). */
export function fibSlow(n) {
  return n < 2 ? n : fibSlow(n - 1) + fibSlow(n - 2);
}
```

Walk through `[1, 2]`: `explore(0)` records `[]`. `i=0`: choose `1`, `explore(1)` records `[1]`; its loop `i=1`: choose `2`, `explore(2)` records `[1,2]`, no more items; un-choose `2`; return, un-choose `1`. `i=1`: choose `2`, `explore(2)` records `[2]`. Result `[[], [1], [1, 2], [2]]`.

### Why memoization is a "closure + recursion" combination

`fib(n)` calls `fib(n-1)` and `fib(n-2)`, which both call `fib(n-3)`..., so the naive version repeats the same work **exponentially**. Counting calls for `fib(5)`: **15 calls** naive vs **9** memoised; for `fib(40)` the naive version takes about a second, and `fib(78)` would take years. A `Map` that remembers each answer makes it **O(n)**. (`fib(78)` is the last Fibonacci number an ordinary JavaScript number holds exactly; after that, use `BigInt`.)

## 7. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fib, fibSlow, permutations, subsets } from "./recursion.js";

const sortKey = (arrs) =>
  arrs
    .map((a) => [...a].sort((x, y) => x - y))
    .sort((a, b) => (a.join() < b.join() ? -1 : 1));

describe("subsets", () => {
  test("[1,2,3] has 8 subsets, in the standard order", () => {
    assert.deepEqual(subsets([1, 2, 3]), [
      [],
      [1],
      [1, 2],
      [1, 2, 3],
      [1, 3],
      [2],
      [2, 3],
      [3],
    ]);
  });
  test("edge cases", () => {
    assert.deepEqual(subsets([]), [[]]); // the empty set has ONE subset: the empty set
    assert.deepEqual(subsets([1]), [[], [1]]);
  });
  test("2^n results and no duplicates", () => {
    const result = subsets([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(result.length, 1024);
    assert.equal(new Set(result.map((s) => s.join(","))).size, 1024);
  });
  test("results are independent copies", () => {
    const result = subsets([1, 2]);
    result[1].push(99);
    assert.deepEqual(result[2], [1, 2]);
  });
});

describe("permutations", () => {
  test("[1,2,3] has 6", () => {
    assert.equal(permutations([1, 2, 3]).length, 6);
    assert.equal(
      new Set(permutations([1, 2, 3]).map((p) => p.join(""))).size,
      6,
    );
  });
  test("edge cases", () => {
    assert.deepEqual(permutations([]), [[]]);
    assert.deepEqual(permutations([7]), [[7]]);
    assert.equal(permutations([1, 2, 3, 4, 5]).length, 120);
  });
});

describe("fib", () => {
  test("values", () => {
    assert.deepEqual(
      [0, 1, 2, 3, 4, 5, 10].map((n) => fib(n)),
      [0, 1, 1, 2, 3, 5, 55],
    );
    assert.equal(fib(50), 12586269025);
    assert.equal(fib(78), 8944394323791464);
  });
  test("memoized fib(78) is instant; the slow version agrees on small n", () => {
    const start = performance.now();
    fib(78);
    assert.ok(performance.now() - start < 50);
    for (let n = 0; n <= 20; n++) assert.equal(fib(n), fibSlow(n));
  });
});
```

## 8. Complexity

|                | Time                                                    | Space                                          |
| -------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `subsets`      | O(n \* 2^n) (2^n subsets, each copied in up to n steps) | O(n) recursion depth, plus the output          |
| `permutations` | O(n \* n!)                                              | O(n) depth + the `used` array, plus the output |
| `fib` memoised | O(n)                                                    | O(n) (map + recursion depth)                   |
| `fibSlow`      | O(2^n)                                                  | O(n) depth                                     |

## 9. Edge cases to mention

Empty input (**one** subset: `[]`), one element, large `n` (the output itself is exponential, so say that no algorithm can beat it), duplicates in the input (this version assumes **distinct** numbers; for duplicates sort first and skip equal neighbours at the same level), and recursion **depth** (very deep recursion can overflow the call stack).

## 10. Common mistakes (checked)

| Mistake                                      | What happens                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `result.push(current)` without copying       | `subsets([1,2,3])` returns eight references to the **same, finally empty** array: 3 tests fail |
| Forgetting the **un-choose** (`pop`)         | the path keeps growing; wrong results                                                          |
| Looping from `0` instead of `start`          | duplicates like `[1,2]` and `[2,1]`                                                            |
| Not recording at every node (only at leaves) | misses the shorter subsets                                                                     |
| No base case in recursion                    | `RangeError: Maximum call stack size exceeded`                                                 |
| Returning `[]` for the empty input           | should be `[[]]`                                                                               |
| Naive `fib` for large `n`                    | exponential time                                                                               |

## 11. The 30-second explanation

> "Each element is either in or out, so there are 2 to the n subsets. I use backtracking: a shared `current` array and a recursive function that first records a copy of `current`, then loops over the remaining elements starting from `start`. For each one I push it, recurse from the next index, and pop it again. Starting from `start` avoids duplicates. The time is O(n times 2^n) because there are 2^n subsets and copying each costs up to n; no solution can be faster, because the output itself is that big."

## 12. Predict the output

**Q1** `subsets([1, 2])`
**Q2** `permutations([1, 2, 3])`
**Q3** How many calls does the naive `fib(5)` make? And the memoised one?
**Q4** What goes wrong here, and what is printed?

```js
const result = [],
  path = [];
function go(i) {
  if (i === 2) {
    result.push(path);
    return;
  }
  path.push(i);
  go(i + 1);
  path.pop();
  go(i + 1);
}
go(0);
console.log(result);
```

## 13. Answers

- **Q1:** `[[], [1], [1, 2], [2]]`.
- **Q2:** `[[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]` (6 = 3!).
- **Q3:** **15** naive; **9** memoised (counting every call, including the ones that hit the cache).
- **Q4:** `path` itself is pushed (no copy), and it is emptied again by the `pop`s. All four entries are the **same array**, which is empty at the end, so it prints `[ [], [], [], [] ]`. Fix: `result.push([...path])`.

## 14. Practice variations

| Problem                               | Hint                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Permutations (above)                  | a `used` array instead of `start`                                            |
| Combination sum                       | pass the remaining target; reuse allowed means recurse with `i`, not `i + 1` |
| Generate parentheses                  | track open/close counts; only add `)` when `close < open`                    |
| Subsets with duplicates               | sort, and skip `nums[i] === nums[i - 1]` at the same level                   |
| Letter combinations of a phone number | one level per digit                                                          |
| Climbing stairs                       | `ways(n) = ways(n-1) + ways(n-2)`: memoised Fibonacci                        |
| Flatten a nested array (Day 2)        | recursion on arrays                                                          |

## Recap

- Recursion = **base case** + a **smaller** call. Backtracking = **choose, explore, un-choose**.
- **Copy** the path when you save a result.
- **Memoize** when sub-problems repeat: exponential becomes linear.
- Say the size of the output: subsets are 2^n, permutations n!.

## Checklist

- [ ] I can write the choose / explore / un-choose template from memory
- [ ] I can explain why the result needs a **copy**
- [ ] I can explain how memoization fixes Fibonacci
- [ ] I solved it from memory and my tests pass
- [ ] I got Q1 to Q4 right without looking
