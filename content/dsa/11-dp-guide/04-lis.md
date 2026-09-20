# LIS (Longest Increasing Subsequence)

Find the length of the longest subsequence (not necessarily contiguous) where elements are strictly increasing.

## Approach 1 — O(n²) DP

`dp[i]` = length of the longest increasing subsequence ending exactly at index `i`.

```javascript
function lengthOfLIS(nums) {
  const n = nums.length;
  if (n === 0) return 0;

  const dp = new Array(n).fill(1); // every element is an LIS of length 1 by itself

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}

console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // 4 -> [2, 3, 7, 101] or [2,3,7,18]
```

## Approach 2 — O(n log n) with binary search

Maintain an array `tails` where `tails[i]` = the smallest possible tail value of an increasing subsequence of length `i + 1`. This array itself stays sorted, so binary search finds where each new number belongs.

```javascript
function lengthOfLISOptimized(nums) {
  const tails = [];

  for (const num of nums) {
    // binary search for the first element in tails >= num
    let left = 0,
      right = tails.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }

    if (left === tails.length) {
      tails.push(num); // num extends the longest subsequence found so far
    } else {
      tails[left] = num; // num replaces an existing tail with a smaller value
    }
  }

  return tails.length;
}

console.log(lengthOfLISOptimized([10, 9, 2, 5, 3, 7, 101, 18])); // 4
```

**Important:** `tails` is not necessarily a valid subsequence itself — it just tracks lengths correctly. To reconstruct the actual subsequence, you'd need to additionally track predecessor indices.

## Why the O(n log n) approach works

Keeping the smallest possible tail value for each subsequence length leaves the most room for future numbers to extend a subsequence — a greedy insight that keeps `tails` sorted and searchable.

## Complexity

DP approach: O(n²) time, O(n) space.
Binary search approach: O(n log n) time, O(n) space.

## Where it shows up

Box stacking, Russian doll envelopes, longest chain of pairs, patience sorting — many problems reduce to LIS once framed correctly.
