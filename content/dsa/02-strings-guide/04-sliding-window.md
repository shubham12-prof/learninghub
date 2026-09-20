# Sliding Window

A technique for scanning a contiguous "window" over a string (or array) without recomputing everything from scratch — you expand/shrink the window and update a running result.

## Fixed-size window — max sum of every substring/subarray of size k

```javascript
function maxWindowSum(arr, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];

  let maxSum = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // slide: add new, remove old
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

console.log(maxWindowSum([2, 1, 5, 1, 3, 2], 3)); // 9 -> [5,1,3]
```

## Variable-size window — longest substring without repeating characters

```javascript
function lengthOfLongestSubstring(s) {
  const seen = new Map(); // char -> last index seen
  let start = 0;
  let maxLen = 0;

  for (let end = 0; end < s.length; end++) {
    const ch = s[end];

    if (seen.has(ch) && seen.get(ch) >= start) {
      start = seen.get(ch) + 1; // shrink window past the duplicate
    }

    seen.set(ch, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }

  return maxLen;
}

console.log(lengthOfLongestSubstring("abcabcbb")); // 3 -> "abc"
```

## Complexity

Fixed window: O(n) time, O(1) space.
Variable window: O(n) time, O(min(n, alphabet size)) space.

## Recognize this pattern when...

The problem asks for "longest/shortest/max/min substring or subarray satisfying some condition."
