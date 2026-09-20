# Variable Window

A sliding window whose size grows and shrinks based on a condition — you expand the right edge to include more elements, and shrink the left edge whenever the window becomes invalid (or you're looking for the smallest valid window).

## Longest Substring Without Repeating Characters

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

## Minimum Size Subarray Sum — smallest window with sum >= target

```javascript
function minSubArrayLen(target, nums) {
  let start = 0;
  let sum = 0;
  let minLen = Infinity;

  for (let end = 0; end < nums.length; end++) {
    sum += nums[end];

    // shrink from the left while the window is still valid
    while (sum >= target) {
      minLen = Math.min(minLen, end - start + 1);
      sum -= nums[start];
      start++;
    }
  }

  return minLen === Infinity ? 0 : minLen;
}

console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2 -> [4, 3]
```

## Longest Substring with At Most K Distinct Characters

```javascript
function lengthOfLongestSubstringKDistinct(s, k) {
  const freq = new Map();
  let start = 0;
  let maxLen = 0;

  for (let end = 0; end < s.length; end++) {
    freq.set(s[end], (freq.get(s[end]) || 0) + 1);

    // shrink while we have too many distinct characters
    while (freq.size > k) {
      const leftChar = s[start];
      freq.set(leftChar, freq.get(leftChar) - 1);
      if (freq.get(leftChar) === 0) freq.delete(leftChar);
      start++;
    }

    maxLen = Math.max(maxLen, end - start + 1);
  }

  return maxLen;
}

console.log(lengthOfLongestSubstringKDistinct("eceba", 2)); // 3 -> "ece"
```

## The two flavors of variable window

- **"Longest window satisfying X"** → expand right always; shrink left only when the window becomes _invalid_.
- **"Shortest window satisfying X"** → expand right until valid; then shrink left as much as possible while it _stays_ valid, recording the minimum each time.

## Complexity

O(n) time — each element is added to the window once and removed at most once, even though there's a nested loop (`end` and `start` each only move forward).
O(k) or O(alphabet size) space for the tracking structure (map/set).

## Recognize this pattern when...

The problem asks for the "longest/shortest substring or subarray" satisfying some condition — no repeats, sum threshold, at most K distinct elements, contains all characters of another string, etc.
