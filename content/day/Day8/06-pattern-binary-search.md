# 06 - Pattern 5: Binary Search (Search, First True, Square Root)

> **Time to learn:** ~70 min | **Level:** Coding | **Interview frequency:** High
> Tests: **11 passing**, including one that **counts how many elements are read** from a 1,000,000-element array (at most 25). A `lo < hi` version fails 4 tests.

## 1. The one idea

If the answer space is **sorted**, or looks like `false, false, false, true, true, true`, you can **cut it in half every step** by checking the middle: **O(log n)**. A million items need at most **20** checks (`log2(1,000,000)` is 19.93).

## 2. Analogy

Guess-my-number from 1 to 100. You say 50: "higher". 75: "lower". 62... After about 7 guesses you always win, because each answer removes half of the possibilities.

## 3. Two templates: learn the second one

**A. Find a value (inclusive range `[lo, hi]`, loop `while (lo <= hi)`)**

```js
while (lo <= hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  if (a[mid] === target) return mid;
  if (a[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}
return -1;
```

**B. Find the first `true` (half-open range `[left, right)`, loop `while (left < right)`)**

```js
while (left < right) {
  const mid = left + Math.floor((right - left) / 2);
  if (predicate(mid))
    right = mid; // mid might be the answer: keep it
  else left = mid + 1; // mid is false: the answer is further right
}
return left;
```

Template B solves a huge family: first bad version, lower bound, insertion position, square root, "minimum capacity so that...", "smallest speed such that...". Often **you binary-search the answer itself**, not an array.

## 4. Problems

1. **Binary search**: index of `target` in a sorted array, or `-1`.
2. **First true**: the first value in `[lo, hi]` where a predicate is `true` (like "First Bad Version": versions `1..n`, once a version is bad all later ones are bad; find the first).
3. **Integer square root**: floor of `sqrt(x)` without `Math.sqrt`: the first `m` with `m * m > x`, minus one.

## 5. How to think about it

- State the **invariant**: "the answer is always inside `[lo, hi]`" (template A) or "the answer is in `[left, right]`, and everything before `left` is false" (template B).
- Every iteration must **shrink** the range, or the loop never ends: that's why you move to `mid + 1` or `mid - 1` and never to `mid` in template A.
- Template A uses `<=` because a **single element** (`lo === hi`) must still be checked. Template B uses `<` because `right` is exclusive.
- **Read `a[mid]` once** (store it in a variable).

## 6. Solutions

```js
// Pattern 5: binary search. If the answer space is SORTED (or "false, false, ..., true, true"), halve it every step: O(log n).

/** Classic: index of target in a sorted array, or -1. */
export function binarySearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1; // inclusive range [lo, hi]
  while (lo <= hi) {
    // <= because a single element (lo === hi) still has to be checked
    const mid = lo + Math.floor((hi - lo) / 2); // (lo + hi) / 2 is the same in JS, but this form never overflows in other languages
    const value = sorted[mid]; // read once
    if (value === target) return mid;
    if (value < target)
      lo = mid + 1; // target is to the right: mid is excluded
    else hi = mid - 1; // target is to the left
  }
  return -1;
}

/**
 * The most useful template: the FIRST value in [lo, hi] for which predicate is true, when the predicate looks like
 * false, false, false, true, true, true. Returns hi + 1 when it is never true. (First Bad Version, lower bound...)
 */
export function firstTrue(lo, hi, predicate) {
  let left = lo;
  let right = hi + 1; // half-open range [left, right); right is the "never true" answer
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (predicate(mid))
      right = mid; // mid might be the first true: keep it
    else left = mid + 1; // mid is false: the answer is further right
  }
  return left;
}

/** Integer square root (floor) by binary search on the answer. O(log x). */
export function mySqrt(x) {
  if (x < 2) return x;
  // The first number whose square is GREATER than x, minus one, is floor(sqrt(x)).
  return firstTrue(1, x, (m) => m * m > x) - 1;
}
```

Walk through `binarySearch([-1, 0, 3, 5, 9, 12], 9)`: `lo=0, hi=5`, `mid=2` (3 < 9) so `lo=3`. `mid=4` (9) found: index 4.

Walk through `firstTrue(1, 5, v => v >= 4)`: `left=1, right=6`; `mid=3` is false, `left=4`; `mid=5` is true, `right=5`; `mid=4` is true, `right=4`; `left === right`: answer **4**.

`mySqrt(8)`: the first `m` with `m*m > 8` is 3 (since `2*2 = 4`, `3*3 = 9`), so the answer is `3 - 1 = 2`.

- **Time O(log n)**, **space O(1)**.
- **Prerequisite:** the data must be **sorted** (or the predicate **monotonic**). If not, binary search gives wrong answers, silently.

## 7. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { binarySearch, firstTrue, mySqrt } from "./binary-search.js";

describe("binarySearch", () => {
  const arr = [-1, 0, 3, 5, 9, 12];
  test("found / not found", () => {
    assert.equal(binarySearch(arr, 9), 4);
    assert.equal(binarySearch(arr, 2), -1);
  });
  test("first element, last element, both ends missed", () => {
    assert.equal(binarySearch(arr, -1), 0);
    assert.equal(binarySearch(arr, 12), 5);
    assert.equal(binarySearch(arr, -100), -1);
    assert.equal(binarySearch(arr, 100), -1);
  });
  test("empty and one element", () => {
    assert.equal(binarySearch([], 1), -1);
    assert.equal(binarySearch([5], 5), 0);
    assert.equal(binarySearch([5], 4), -1);
  });
  test("every element of every size 0..40 is found", () => {
    for (let n = 0; n <= 40; n++) {
      const a = Array.from({ length: n }, (_, i) => i * 2);
      for (let i = 0; i < n; i++) assert.equal(binarySearch(a, a[i]), i);
      assert.equal(binarySearch(a, 1), -1);
    }
  });
  test("duplicates: returns SOME valid index", () => {
    const i = binarySearch([1, 2, 2, 2, 3], 2);
    assert.ok([1, 2, 3].includes(i));
  });
  test("reads at most 25 elements of a 1,000,000-element array (O(log n), not a hidden linear scan)", () => {
    let reads = 0;
    const big = new Proxy(
      Array.from({ length: 1_000_000 }, (_, i) => i),
      {
        get(target, prop, receiver) {
          if (typeof prop === "string" && /^\d+$/.test(prop)) reads++;
          return Reflect.get(target, prop, receiver);
        },
      },
    );
    assert.equal(binarySearch(big, 765_432), 765_432);
    assert.ok(reads <= 25, `read ${reads} elements`);
  });
});

describe("firstTrue", () => {
  test("first bad version", () => {
    const bad = 4;
    assert.equal(
      firstTrue(1, 5, (v) => v >= bad),
      4,
    );
    assert.equal(
      firstTrue(1, 1, (v) => v >= 1),
      1,
    );
    assert.equal(
      firstTrue(1, 1_000_000, (v) => v >= 765_432),
      765_432,
    );
  });
  test("never true -> hi + 1; always true -> lo", () => {
    assert.equal(
      firstTrue(1, 10, () => false),
      11,
    );
    assert.equal(
      firstTrue(1, 10, () => true),
      1,
    );
  });
  test("lower bound in a sorted array: first index with value >= target", () => {
    const a = [1, 2, 2, 2, 5, 8];
    assert.equal(
      firstTrue(0, a.length - 1, (i) => a[i] >= 2),
      1,
    );
    assert.equal(
      firstTrue(0, a.length - 1, (i) => a[i] >= 3),
      4,
    );
    assert.equal(
      firstTrue(0, a.length - 1, (i) => a[i] >= 9),
      6,
    );
  });
});

describe("mySqrt", () => {
  test("values", () => {
    for (const [x, r] of [
      [0, 0],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 2],
      [8, 2],
      [9, 3],
      [16, 4],
      [26, 5],
      [2147395599, 46339],
    ])
      assert.equal(mySqrt(x), r, `sqrt(${x})`);
  });
  test("agrees with Math.floor(Math.sqrt) for 0..2000", () => {
    for (let x = 0; x <= 2000; x++)
      assert.equal(mySqrt(x), Math.floor(Math.sqrt(x)));
  });
});
```

## 8. Edge cases to mention

Empty array, one element (found / not found), target smaller than all, larger than all, first and last element, **duplicates** (this version returns _some_ matching index; "first occurrence" is `firstTrue` with `a[i] >= target`), never-true predicate (returns `hi + 1`), always-true (returns `lo`), and very large ranges.

A note on overflow: in languages with fixed-size integers `(lo + hi) / 2` can overflow, so write `lo + (hi - lo) / 2`. JavaScript numbers don't overflow here, but interviewers like to hear that you know.

## 9. Common mistakes (checked)

| Mistake                                  | What happens                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `while (lo < hi)` in template A          | misses the single remaining element: **4 tests fail** (first/last element, empty and one-element arrays, every element of small arrays) |
| `lo = mid` or `hi = mid` in template A   | infinite loop when the range has two elements                                                                                           |
| Binary search on an **unsorted** array   | wrong answers without any error                                                                                                         |
| Reading `a[mid]` several times           | more reads than needed (my first version read 33 elements instead of 20)                                                                |
| Off-by-one in the answer of "first true" | return `left`, not `left - 1` (the square-root problem subtracts one **on purpose**)                                                    |
| Forgetting the "not found" result        | `-1` for search, `hi + 1` for first true                                                                                                |
| Linear scan "because it's fine"          | passes small tests; the **read-count test** catches it                                                                                  |

## 10. The 30-second explanation

> "Binary search needs sorted data, or a yes/no condition that flips once. I keep a range where the answer must be. Each step I look at the middle: if it's too small I discard the left half, otherwise the right half. The range halves each time, so a million items take about 20 steps: O(log n) time and O(1) space. I loop while `lo <= hi` so the last single element is still checked, and I compute the midpoint as `lo + floor((hi - lo) / 2)`. A more general version finds the first value where a condition becomes true, which also solves problems like first bad version or integer square root."

## 11. Predict the output

**Q1** `mySqrt(8)`
**Q2** `firstTrue(1, 10, () => false)`
**Q3** `binarySearch([1, 3, 5, 7], 4)`
**Q4** About how many steps does binary search need for 1,000,000 elements? For 1,000,000,000?
**Q5** Why must the array be sorted?

## 12. Answers

- **Q1:** **2**.
- **Q2:** **11** (`hi + 1`: the "never true" answer).
- **Q3:** **-1**.
- **Q4:** about **20** (log2 of a million is 19.93) and about **30** for a billion. That is why it is the standard answer to "how would you find this faster?".
- **Q5:** Because each step throws away half of the data **on the assumption** that everything on one side is smaller (or larger) than the middle. Without order, the discarded half might contain the answer.

## 13. Practice variations

| Problem                                       | Hint                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| Search insert position                        | `firstTrue` with `a[i] >= target`                                                |
| First and last position of a value            | two `firstTrue` calls (`>= target` and `> target`)                               |
| Search in a rotated sorted array              | one half is always sorted: decide which, then check if the target is in it       |
| Find the peak element                         | compare `a[mid]` with `a[mid + 1]`                                               |
| Koko eating bananas / ship packages in D days | binary search the **answer** (speed/capacity) with a "can it be done?" predicate |
| Sqrt (above)                                  | `firstTrue` on `m * m > x`                                                       |

## Recap

- Sorted data or a **monotonic yes/no condition**: halve it every step, O(log n).
- Template A for exact search (`lo <= hi`); **template B** for "first true" (`left < right`): it solves most variants.
- Keep an **invariant**; always shrink the range; handle empty, one element and "not found".

## Checklist

- [ ] I can write both templates from memory
- [ ] I can say why `<=` and why `mid + 1` / `mid - 1`
- [ ] I can turn "smallest X such that..." into a predicate for `firstTrue`
- [ ] I solved it from memory and my tests pass
- [ ] I got Q1 to Q5 right without looking
