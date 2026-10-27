# 03 - Pattern 2: Two Pointers (Container With Most Water)

> **Time to learn:** ~70 min | **Level:** Coding | **Interview frequency:** Very high
> Tests: **19 passing**, including a random comparison with brute force and a 100,000-bar speed test. A version that moves the **taller** bar fails; the brute force fails the speed test.

## 1. The one idea

Keep **two indexes** and move them by a rule that **discards options you can prove are useless**. One pass, no extra memory: O(n) time, O(1) space. Two common setups: **both ends moving inward** (sorted arrays, palindromes, containers) or **slow and fast** moving the same direction (in-place edits, linked lists).

## 2. Analogy

Two people searching a shelf of books sorted by price, one from the cheap end and one from the expensive end, to find two books that add up to your budget. If the total is too high, the person at the expensive end steps in; too low, the cheap end steps in. They meet in the middle without checking every pair.

## 3. Template (ends moving inward)

```js
let left = 0, right = arr.length - 1;
while (left < right) {
  // look at arr[left] and arr[right]
  if (/* answer found */) return ...;
  if (/* need a bigger value */) left++;
  else right--;
}
```

## 4. Warm-up: valid palindrome

Ignore case and anything that isn't a letter or digit: `"A man, a plan, a canal: Panama"` is a palindrome. Two pointers walk inward; skip characters that aren't alphanumeric; compare the rest case-insensitively. O(n) time, **O(1) space** (no cleaned-up copy of the string).

## 5. The problem: Container With Most Water

`heights[i]` is the height of a vertical line at position `i`. Pick two lines; with the x-axis they form a container whose area is `width * min(height)`. Return the **largest area**.

```
[1, 8, 6, 2, 5, 4, 8, 3, 7]  ->  49     lines at index 1 (8) and 8 (7): width 7 * height 7
[1, 1]  ->  1
```

## 6. How to think about it

1. **Brute force:** try every pair: O(n^2). Fine for small input, too slow for 100,000 bars.
2. **Start with the widest container** (both ends). The area is limited by the **shorter** line.
3. **Which pointer should move?** Moving the _taller_ line inward makes the width smaller and the limiting (shorter) height can't increase, so the area **can't get better**. Only moving the _shorter_ line might find a taller one. So **discard the shorter line** every step.
4. Each step removes one index, so there are `n - 1` steps: **O(n)**.

## 7. Solution

```js
// Pattern 2: two pointers. Start at both ends (or both at the start) and move them with a rule, so one pass is enough.

/** Warm-up: palindrome, ignoring case and anything that is not a letter or digit. O(n) time, O(1) extra space. */
export function isPalindrome(s) {
  const isAlnum = (ch) => /[a-z0-9]/i.test(ch);
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (!isAlnum(s[left])) {
      left++;
      continue;
    }
    if (!isAlnum(s[right])) {
      right--;
      continue;
    }
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}

/** Container With Most Water: pick two bars so that width * min(height) is largest. O(n) time, O(1) space. */
export function maxArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let best = 0;
  while (left < right) {
    const area = (right - left) * Math.min(heights[left], heights[right]);
    best = Math.max(best, area);
    // The shorter bar limits the area. Moving the TALLER one can only shrink the width and cannot raise the limit,
    // so the only move that might help is to discard the shorter bar.
    if (heights[left] < heights[right]) left++;
    else right--;
  }
  return best;
}

/** Brute force for comparison: every pair. O(n^2). */
export function maxAreaBrute(heights) {
  let best = 0;
  for (let i = 0; i < heights.length; i++)
    for (let j = i + 1; j < heights.length; j++)
      best = Math.max(best, (j - i) * Math.min(heights[i], heights[j]));
  return best;
}

/** Variant: Two Sum on a SORTED array (1-based answer not needed here: returns indices). O(n), O(1) space. */
export function twoSumSorted(sorted, target) {
  let left = 0;
  let right = sorted.length - 1;
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target)
      left++; // need a bigger sum: move the small end up
    else right--; // need a smaller sum: move the big end down
  }
  return null;
}
```

Walk through `[1, 8, 6, 2, 5, 4, 8, 3, 7]`: `l=0, r=8`: width 8 _ min(1,7) = 8; the left line is shorter, so `l=1`. `l=1, r=8`: 7 _ min(8,7) = 49 (best); the right line is shorter, `r=7`. `l=1, r=7`: 6 \* min(8,3) = 18; `r=6`... no later pair beats 49. Result **49**.

## 8. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isPalindrome,
  maxArea,
  maxAreaBrute,
  twoSumSorted,
} from "./two-pointers.js";

describe("isPalindrome", () => {
  const cases = [
    ["A man, a plan, a canal: Panama", true],
    ["race a car", false],
    ["", true],
    [" ", true],
    [".,", true],
    ["0P", false],
    ["ab_a", true],
    ["a", true],
    ["No 'x' in Nixon", true],
  ];
  for (const [input, expected] of cases)
    test(`${JSON.stringify(input)} -> ${expected}`, () =>
      assert.equal(isPalindrome(input), expected));
});

describe("maxArea", () => {
  const cases = [
    [[1, 8, 6, 2, 5, 4, 8, 3, 7], 49],
    [[1, 1], 1],
    [[4, 3, 2, 1, 4], 16],
    [[1, 2, 1], 2],
    [[], 0],
    [[5], 0],
    [[0, 0, 0], 0],
  ];
  for (const [input, expected] of cases)
    test(`${JSON.stringify(input)} -> ${expected}`, () =>
      assert.equal(maxArea(input), expected));

  test("agrees with brute force on random input", () => {
    for (let n = 0; n < 300; n++) {
      const h = Array.from({ length: Math.floor(Math.random() * 15) }, () =>
        Math.floor(Math.random() * 20),
      );
      assert.equal(maxArea(h), maxAreaBrute(h), JSON.stringify(h));
    }
  });
  test("100,000 bars is fast (needs O(n))", () => {
    const h = Array.from({ length: 100_000 }, (_, i) => (i * 7919) % 1000);
    const start = performance.now();
    maxArea(h);
    assert.ok(performance.now() - start < 100, "too slow: O(n^2)?");
  });
});

describe("twoSumSorted", () => {
  test("finds the pair", () => {
    assert.deepEqual(twoSumSorted([1, 2, 4, 7, 11, 15], 15), [2, 4]);
    assert.deepEqual(twoSumSorted([2, 7, 11, 15], 9), [0, 1]);
    assert.deepEqual(twoSumSorted([-3, 0, 3], 0), [0, 2]);
    assert.equal(twoSumSorted([1, 2, 3], 100), null);
    assert.equal(twoSumSorted([], 1), null);
  });
});
```

## 9. Edge cases to mention

Empty array and one bar (area 0, because you need two lines), two bars, all zeros, equal heights (either pointer may move), a very large array, and the case where the best container is at the ends vs in the middle.

## 10. Common mistakes (checked)

| Mistake                                                      | What happens                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Moving the **taller** pointer                                | wrong answers: the very first example fails (`[1,8,6,2,5,4,8,3,7]`)              |
| Brute force on 100,000 bars                                  | correct but the speed test fails (about 5 billion pairs)                         |
| `while (left <= right)`                                      | compares a line with itself (width 0), harmless here but a bug in other problems |
| Palindrome: building a cleaned string and reversing it       | works, but O(n) extra space; two pointers need none                              |
| Palindrome: forgetting digits, so `"0P"` is treated as equal | `"0P"` must be **false** (`0` and `P` differ)                                    |

## 11. The 30-second explanation

> "I start with two pointers at both ends, which is the widest container. The area is width times the shorter line. If I move the taller line inward, the width shrinks and the shorter line is still the limit, so the area can't improve; only moving the shorter line might. So at each step I record the area and move the pointer at the shorter line. Every step discards one index, so it's one pass: O(n) time and O(1) space, compared with O(n^2) for trying every pair."

## 12. Predict the output

**Q1** `maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])`
**Q2** `maxArea([3, 9, 3, 4, 7, 2, 12, 6])`
**Q3** `isPalindrome("0P")`
**Q4** `twoSumSorted([1, 2, 4, 7, 11, 15], 15)`
**Q5** Why does two-sum with two pointers need a **sorted** array?

## 13. Answers

- **Q1:** **49**.
- **Q2:** **45** (the lines `9` at index 1 and `12` at index 6: width 5 \* min(9, 12) = 45).
- **Q3:** **false**.
- **Q4:** **`[2, 4]`** (`4 + 11 = 15`).
- **Q5:** Because the move rule relies on order: if the sum is too small, only moving the **left** pointer up can make it larger; if too big, only moving the **right** pointer down can make it smaller. Without sorting, that reasoning fails (use a `Map` instead, as in `02`).

## 14. Practice variations

| Problem                                        | Hint                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| Two Sum II (sorted)                            | the template above                                                    |
| 3Sum                                           | sort, fix one number, two pointers for the other two; skip duplicates |
| Remove duplicates from a sorted array in place | slow pointer writes, fast pointer reads                               |
| Move zeroes to the end                         | slow/fast pointers                                                    |
| Reverse a string in place (Day 1)              | swap and move inward                                                  |
| Trapping rain water                            | two pointers with running left/right maxima                           |

## Recap

- **Two pointers** discard options you can _prove_ are useless; one pass, O(1) space.
- Container: **always move the shorter line**.
- Needs **sorted** input for sum problems; for unsorted input use a hash map.

## Checklist

- [ ] I can prove why moving the taller line can't help
- [ ] I can say when to use both-ends vs slow/fast pointers
- [ ] I solved it from memory and my tests pass
- [ ] I got Q1 to Q5 right without looking
