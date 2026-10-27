# 02 - Pattern 1: Hash Map and Hash Set (Longest Consecutive Sequence)

> **Time to learn:** ~70 min | **Level:** Coding | **Interview frequency:** Very high (the most common pattern)
> Tests: **12 passing** (`node --test hash-set.test.js`). A version without the key trick **fails the 100,000-number speed test**. Try the problem for 20 minutes before reading the solution.

## 1. The one idea

A `Map` or `Set` answers "have I seen this?" in **O(1)** (on average). Whenever you catch yourself scanning an array again and again to look something up, **put it in a `Set`/`Map` first** and the inner loop disappears: O(n^2) becomes O(n). You are trading **memory for speed**.

## 2. Analogy

A coat check. Searching every coat on the rack (an array scan) takes long. With a **ticket number** (a hash key) the attendant goes straight to your coat.

## 3. Template

```js
const seen = new Map(); // or new Set()
for (const x of items) {
  if (seen.has(need(x))) {
    /* found a match: use seen.get(...) */
  }
  seen.set(x, info);
}
```

Typical uses: **counting** (frequency), **detecting duplicates**, **pair lookups** (two sum: `target - x`), **grouping** (key to list), **caching**.

## 4. The problem: Longest Consecutive Sequence

Given an unsorted array of integers, return the **length of the longest run of consecutive numbers** (like `1, 2, 3, 4`). The numbers may appear in any order. Required: **O(n)** time.

```
[100, 4, 200, 1, 3, 2]  ->  4        the run is 1, 2, 3, 4
[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]  ->  9     0 to 8; the duplicate 0 doesn't matter
[]  ->  0
```

## 5. How to think about it

1. **Brute force:** for each number, keep searching the array for `n + 1`, `n + 2`... Each search is O(n), so O(n^2) or worse.
2. **Sort first**, then scan for runs: simple and correct, but O(n log n), and the problem asks for O(n).
3. **Bottleneck:** the repeated searching. A `Set` gives O(1) `has`.
4. **Second problem:** if you start counting from _every_ number, you re-walk the same run many times (for `1..n` it is O(n^2)). **Only start from the first number of a run**, i.e. when `n - 1` is **not** in the set. Then every number is visited a constant number of times.

## 6. Solution

```js
// Pattern 1: hash map / hash set. Trade memory for speed: O(1) lookups replace inner loops.

/** Longest Consecutive Sequence: length of the longest run like 1,2,3,4 (any order in the input). O(n) time, O(n) space. */
export function longestConsecutive(nums) {
  const set = new Set(nums); // also removes duplicates
  let best = 0;
  for (const n of set) {
    if (set.has(n - 1)) continue; // not the START of a run: skip (this line makes it O(n))
    let end = n;
    while (set.has(end + 1)) end++; // walk the run once
    best = Math.max(best, end - n + 1);
  }
  return best;
}

/** Warm-up (from Day 6): Two Sum with a Map of value -> index. O(n). */
export function twoSum(nums, target) {
  const indexOf = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (indexOf.has(need)) return [indexOf.get(need), i];
    indexOf.set(nums[i], i);
  }
  return null;
}

/** Variant: first character that appears exactly once (index), or -1. Two passes with a Map of counts. O(n). */
export function firstUniqueChar(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  for (let i = 0; i < s.length; i++) if (counts.get(s[i]) === 1) return i;
  return -1;
}
```

Walk through `[100, 4, 200, 1, 3, 2]`: the set holds all six. `100`: `99` isn't in the set, so it is a start; `101` isn't either: length 1. `4`: `3` is in the set, so **skip**. `200`: length 1. `1`: `0` isn't there, start: `2`, `3`, `4` are all in the set, `5` isn't: length 4. `3` and `2`: skipped. Best = 4.

- **Time O(n):** building the set is O(n); each number is the _middle_ of a walk at most once, because only run starts walk.
- **Space O(n)** for the set.

## 7. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { firstUniqueChar, longestConsecutive, twoSum } from "./hash-set.js";

describe("longestConsecutive", () => {
  const cases = [
    [[100, 4, 200, 1, 3, 2], 4],
    [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1], 9],
    [[], 0],
    [[1], 1],
    [[1, 1, 1], 1],
    [[-1, -2, -3, 5], 3],
    [[10, 5, 12, 3, 55, 30, 4, 11, 2], 4],
    [[1, 3, 5, 7], 1],
  ];
  for (const [input, expected] of cases)
    test(`${JSON.stringify(input)} -> ${expected}`, () =>
      assert.equal(longestConsecutive(input), expected));

  test("does not modify the input", () => {
    const input = [3, 2, 1];
    longestConsecutive(input);
    assert.deepEqual(input, [3, 2, 1]);
  });
  test("100,000 consecutive numbers is fast (needs the 'is this a start?' check)", () => {
    const nums = Array.from({ length: 100_000 }, (_, i) => i).reverse();
    const start = performance.now();
    assert.equal(longestConsecutive(nums), 100_000);
    assert.ok(performance.now() - start < 300, "too slow: O(n^2)?");
  });
});

describe("twoSum and firstUniqueChar", () => {
  test("twoSum", () => {
    assert.deepEqual(twoSum([2, 7, 11, 15], 9), [0, 1]);
    assert.deepEqual(twoSum([3, 2, 4], 6), [1, 2]);
    assert.deepEqual(twoSum([3, 3], 6), [0, 1]);
    assert.equal(twoSum([1, 2], 9), null);
  });
  test("firstUniqueChar", () => {
    assert.equal(firstUniqueChar("leetcode"), 0);
    assert.equal(firstUniqueChar("loveleetcode"), 2);
    assert.equal(firstUniqueChar("aabb"), -1);
    assert.equal(firstUniqueChar(""), -1);
  });
});
```

## 8. Edge cases to mention

Empty array (0), one element (1), **duplicates** (the set removes them: `[1, 1, 1]` is 1), **negative numbers**, no consecutive numbers (answer 1), already sorted or reverse-sorted input, and do **not** modify the input.

## 9. Common mistakes (checked)

| Mistake                                                                   | What happens                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Starting a walk from **every** number (no `if (set.has(n - 1)) continue`) | the answer is still correct, but the **100,000-number test fails** (O(n^2)) |
| Looping over the **array** instead of the **set**                         | duplicates repeat the same walk                                             |
| Using `arr.includes(n + 1)` instead of a `Set`                            | O(n) per check, O(n^2) overall                                              |
| Sorting the input in place                                                | changes the caller's array                                                  |
| Returning `1` for an empty array                                          | should be `0`                                                               |

## 10. The 30-second explanation

> "I put all numbers in a hash set, which also removes duplicates. Then for each number I check whether its predecessor is in the set. If it is, this number is in the middle of a run, so I skip it; if not, it is the start of a run, so I count upwards while the next number exists. Each number is visited a constant number of times, so it's O(n) time and O(n) space. The brute force is O(n^2), and sorting would be O(n log n)."

## 11. Predict the output

**Q1** `longestConsecutive([1, 2, 0, 1])`
**Q2** `longestConsecutive([9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6])`
**Q3** `firstUniqueChar("aabbc")`
**Q4** What is the time complexity if you removed the line `if (set.has(n - 1)) continue;`, and for which input is it worst?

## 12. Answers

- **Q1:** **3** (`0, 1, 2`; the duplicate `1` is ignored).
- **Q2:** **7** (`3, 4, 5, 6, 7, 8, 9`; the run `-1, 0, 1` has length 3, and `2` is missing).
- **Q3:** **4** (the index of `c`).
- **Q4:** **O(n^2)** in the worst case: a fully consecutive array like `1..n`, because every number starts a walk of up to `n` steps.

## 13. Practice variations (do them from memory)

| Problem                        | Hint                                          | Time         |
| ------------------------------ | --------------------------------------------- | ------------ |
| Two Sum (Day 6)                | `Map` of value to index; look up `target - x` | O(n)         |
| First unique character (above) | count in a `Map`, then scan in order          | O(n)         |
| Contains duplicate             | `Set` size vs array length                    | O(n)         |
| Valid anagram                  | count letters, compare the counts             | O(n)         |
| Group anagrams (Day 6)         | key = sorted letters                          | O(n k log k) |
| Subarray sum equals k          | **prefix sums** + `Map` of sum to count       | O(n)         |

## Recap

- A `Map`/`Set` turns repeated searching into **O(1) lookups**: memory for speed.
- Longest Consecutive Sequence: set + **only start at the beginning of a run** = O(n).
- Always say the brute force, the bottleneck, and the complexity.

## Checklist

- [ ] I can explain why `has(n - 1)` makes it O(n)
- [ ] I can name three uses of a `Map`/`Set`
- [ ] I solved it from memory and my tests pass
- [ ] I got Q1 to Q4 right without looking
