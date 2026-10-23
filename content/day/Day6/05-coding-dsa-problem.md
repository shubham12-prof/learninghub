# 05 - Coding: Longest Substring Without Repeating Characters (Sliding Window)

> **Time to learn:** ~75 min | **Level:** Coding (today's **1 DSA problem**) | **Interview frequency:** Very high (a famous LeetCode problem, #3)
> Solutions and tests were run with Node 22 `node:test`: **18 tests passing**, including a randomised comparison against brute force.
> Rule: **try the problem yourself for 20 minutes before reading the solution.**

## 1. The problem

Given a string `s`, return the **length of the longest substring that has no repeating characters**. (A _substring_ is a contiguous piece, not a subsequence.)

```
"abcabcbb" -> 3   ("abc")
"bbbbb"    -> 1   ("b")
"pwwkew"   -> 3   ("wke"; note "pwke" is NOT a substring)
""         -> 0
```

## 2. Approach: how to think about it out loud

1. **Clarify:** only lowercase letters, or any characters? Case-sensitive? (Assume any characters, case-sensitive.) Empty string? (0.)
2. **Brute force:** check every substring, test for duplicates. O(n^3) with a naive duplicate test. Say it, then improve it.
3. **Notice the waste:** if `s[i..j]` is valid, we don't need to restart at `i+1`; we only need to move the **left edge past the duplicate**.
4. **Sliding window:** keep a window `[left, right]` with no repeats. Move `right` forward one character at a time. If `s[right]` is already in the window, move `left` forward (removing characters) until it isn't. Track the biggest window.

**Analogy:** a caterpillar crawling along the string. The head (`right`) always advances; the tail (`left`) only moves when the head bumps into something already inside the body.

## 3. Solution

```js
// Longest Substring Without Repeating Characters

/** Brute force: check every substring. O(n^3) time, O(min(n, k)) space. */
export function lengthBrute(s) {
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      if (hasDuplicate(s.slice(i, j + 1))) break;
      best = Math.max(best, j - i + 1);
    }
  }
  return best;
}
function hasDuplicate(str) {
  return new Set(str).size !== str.length;
}

/** Sliding window + Set. O(n) time (each char enters and leaves the window at most once), O(k) space. */
export function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      // shrink until the duplicate is gone
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

Walk-through on `"dvdf"` (the trap case):

| right | char | window before | action                           | window after | best  |
| ----- | ---- | ------------- | -------------------------------- | ------------ | ----- |
| 0     | d    | ``            | add                              | `d`          | 1     |
| 1     | v    | `d`           | add                              | `dv`         | 2     |
| 2     | d    | `dv`          | `d` is inside: drop `d` (left=1) | `vd`         | 2     |
| 3     | f    | `vd`          | add                              | `vdf`        | **3** |

### Complexity

- **Time O(n):** `right` visits each character once; `left` also moves forward at most `n` times in total, so every character is added and removed at most once. (The nested `while` does **not** make it O(n^2).)
- **Space O(k):** the set holds at most `k` distinct characters (k = alphabet size, or `min(n, k)`).
- Brute force: **O(n^3)** time (O(n^2) substrings, O(n) to check each).

## 4. A faster variant: remember the last index

Instead of removing characters one by one, store each character's **last position** and jump `left` straight past the duplicate. It also returns the substring itself.

```js
/** Sliding window + Map of last index: the left edge jumps straight past the duplicate. Also O(n). Returns the substring. */
export function longestSubstring(s) {
  const lastIndex = new Map();
  let left = 0;
  let bestStart = 0;
  let bestLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastIndex.has(ch) && lastIndex.get(ch) >= left)
      left = lastIndex.get(ch) + 1; // ">= left": ignore stale entries
    lastIndex.set(ch, right);
    if (right - left + 1 > bestLen) {
      bestLen = right - left + 1;
      bestStart = left;
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}
```

The guard `lastIndex.get(ch) >= left` matters: an entry may point **outside** the current window (a stale entry) and must be ignored.

## 5. Common mistakes (each one was run)

1. **Resetting the window to empty or to 0 on a duplicate.** For `"dvdf"` a `seen.clear(); left = right` approach returns **2** instead of **3**.
2. **Forgetting the `>= left` guard** in the Map version. For `"abba"` the buggy version returns **3** instead of **2** (after the second `b`, the old `a` at index 0 is already outside the window, but the code jumps `left` backwards).
3. Mixing up **substring** and **subsequence** (`"pwwkew"`: the answer is 3, not 4).
4. Updating `best` **before** shrinking the window.
5. Forgetting the empty string (the loop simply doesn't run, giving 0, so no special case is needed, but say so).
6. Recomputing the duplicate check with `includes`/`slice` inside the loop (silently O(n^2) or worse).
7. Off-by-one in the window length: it is `right - left + 1`.

## 6. Edge cases (all in the test file)

| Input              | Expected       | Why it matters                           |
| ------------------ | -------------- | ---------------------------------------- |
| `""`               | 0              | no characters                            |
| `"a"`              | 1              | single character                         |
| `"bbbbb"`          | 1              | all duplicates                           |
| `"au"`             | 2              | no duplicates at all                     |
| `"dvdf"`           | 3              | the window must not reset to 0           |
| `"abba"`           | 2              | stale index in the Map version           |
| `"tmmzuxt"`        | 5              | duplicate in the middle, then a long run |
| `" "`, `"a b a"`   | 1, 3           | spaces are characters                    |
| 100,000 characters | 10 in < 200 ms | proves O(n)                              |

## 7. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  groupAnagrams,
  lengthBrute,
  lengthOfLongestSubstring,
  longestSubstring,
  maxSumWindow,
  twoSum,
} from "./solution.js";

const cases = [
  ["abcabcbb", 3],
  ["bbbbb", 1],
  ["pwwkew", 3],
  ["", 0],
  ["a", 1],
  ["au", 2],
  ["dvdf", 3], // the classic trap: left must not reset to 0
  ["abba", 2], // the stale-index trap for the Map version
  ["tmmzuxt", 5],
  [" ", 1],
  ["a b a", 3],
  ["aab", 2],
];

describe("longest substring without repeating characters", () => {
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      assert.equal(lengthBrute(input), expected);
      assert.equal(lengthOfLongestSubstring(input), expected);
      assert.equal(longestSubstring(input).length, expected);
    });
  }
  test("longestSubstring returns the first longest substring", () => {
    assert.equal(longestSubstring("abcabcbb"), "abc");
    assert.equal(longestSubstring("pwwkew"), "wke");
    assert.equal(longestSubstring(""), "");
  });
  test("random strings: fast version agrees with brute force", () => {
    for (let n = 0; n < 300; n++) {
      const s = Array.from(
        { length: Math.floor(Math.random() * 20) },
        () => "abcd"[Math.floor(Math.random() * 4)],
      ).join("");
      assert.equal(lengthOfLongestSubstring(s), lengthBrute(s), s);
      assert.equal(longestSubstring(s).length, lengthBrute(s), s);
    }
  });
  test("100,000 characters finishes quickly (O(n))", () => {
    const s = "abcdefghij".repeat(10_000);
    const start = performance.now();
    assert.equal(lengthOfLongestSubstring(s), 10);
    assert.ok(performance.now() - start < 200);
  });
});

describe("variants", () => {
  test("twoSum", () => {
    assert.deepEqual(twoSum([2, 7, 11, 15], 9), [0, 1]);
    assert.deepEqual(twoSum([3, 3], 6), [0, 1]); // same value twice
    assert.deepEqual(twoSum([3, 2, 4], 6), [1, 2]); // must not use 3 twice
    assert.equal(twoSum([1, 2], 10), null);
    assert.equal(twoSum([], 1), null);
  });
  test("groupAnagrams", () => {
    assert.deepEqual(
      groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]),
      [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]],
    );
    assert.deepEqual(groupAnagrams([]), []);
    assert.deepEqual(groupAnagrams([""]), [[""]]);
  });
  test("maxSumWindow", () => {
    assert.equal(maxSumWindow([2, 1, 5, 1, 3, 2], 3), 9);
    assert.equal(maxSumWindow([-1, -2, -3], 2), -3);
    assert.equal(maxSumWindow([1, 2], 3), null);
    assert.equal(maxSumWindow([5], 1), 5);
  });
});
```

The "random strings" test compares the fast version with brute force on 300 random strings. This is a very useful habit: **keep the slow, obviously-correct version as an oracle.**

## 8. Practice variations (all solved and tested in `solution.js`)

| Variation                                             | Idea                                                                           | Time            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | --------------- |
| **Two Sum** (`twoSum`)                                | one pass; store `value -> index` in a Map and look for `target - current`      | O(n)            |
| **Group Anagrams** (`groupAnagrams`)                  | key = the word's letters sorted; group by key in a Map                         | O(n \* k log k) |
| **Max sum of k consecutive numbers** (`maxSumWindow`) | **fixed-size** sliding window: add the new element, subtract the one that left | O(n)            |

```js
// ---- Variants ----

/** Two Sum: indices of two numbers adding to target. One pass with a Map. O(n) time, O(n) space. */
export function twoSum(nums, target) {
  const indexOf = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (indexOf.has(need)) return [indexOf.get(need), i];
    indexOf.set(nums[i], i);
  }
  return null;
}

/** Group Anagrams: key = sorted letters. O(n * k log k). */
export function groupAnagrams(words) {
  const groups = new Map();
  for (const w of words) {
    const key = [...w].sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return [...groups.values()];
}

/** Max sum of any k consecutive numbers: fixed-size window. O(n). */
export function maxSumWindow(nums, k) {
  if (k <= 0 || k > nums.length) return null;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k]; // slide: add the new, drop the old
    best = Math.max(best, sum);
  }
  return best;
}
```

Tests for the variants include: `twoSum([3, 2, 4], 6)` must give `[1, 2]` (not use the same `3` twice), `twoSum([3, 3], 6)` gives `[0, 1]`, and `groupAnagrams([""])` gives `[[""]]`.

Further practice (same pattern): _Longest substring with at most K distinct characters_, _Minimum window substring_, _Longest repeating character replacement_, _Valid anagram_, _Best time to buy and sell stock_.

## 9. Patterns to remember

| Signal in the problem                                         | Technique                            |
| ------------------------------------------------------------- | ------------------------------------ |
| "contiguous subarray/substring", "longest/shortest/at most K" | **sliding window**                   |
| "have I seen this before?", "pair that sums to X"             | **Set / Map** (trade space for time) |
| "sorted array", "pair in sorted order"                        | **two pointers**                     |
| "group by some property"                                      | **Map with a computed key**          |

## 10. Say it in the interview (30 seconds)

> "A brute force checks every substring, which is O(n cubed). Instead I use a sliding window: a Set holds the characters in the current window. I move the right edge one step at a time; if the new character is already in the set, I move the left edge forward, removing characters, until the duplicate is gone. Then I add it and update the best length. Each character enters and leaves the window at most once, so it's O(n) time and O(k) space, where k is the number of distinct characters. Edge cases: empty string, all the same character, and a case like 'dvdf' where you must not reset the window to zero."

## Recap

- **Sliding window** = two pointers that define a valid range; grow on the right, shrink on the left.
- Longest substring without repeats: **O(n) time, O(k) space** with a Set (or a Map of last indexes).
- Watch the traps: `"dvdf"` (don't reset) and `"abba"` (ignore stale indexes).
- Keep a brute-force oracle and test against random inputs.

## Checklist

- [ ] I solved it myself (or re-wrote it from memory) in under 20 minutes
- [ ] I can state the brute force and why the window is faster
- [ ] I can explain why the nested loop is still O(n)
- [ ] I can name the two traps (`dvdf`, `abba`)
- [ ] I solved at least one variation (Two Sum, Group Anagrams or the fixed window)
