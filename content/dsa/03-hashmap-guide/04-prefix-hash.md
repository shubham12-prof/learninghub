# Prefix Hash

Combines the "running total" idea from prefix sums with a hash map, so you can answer questions like "does a subarray/substring with a certain property exist?" in O(n) instead of checking every possible subarray.

## Classic example — Subarray Sum Equals K

Instead of checking every subarray (O(n²)), track running sums in a hash map. If `runningSum - k` has been seen before, a subarray summing to `k` exists ending at the current index.

```javascript
function subarraySum(nums, k) {
  const prefixCount = new Map();
  prefixCount.set(0, 1); // empty prefix sums to 0

  let runningSum = 0;
  let count = 0;

  for (const num of nums) {
    runningSum += num;

    // if (runningSum - k) was seen before, those subarrays sum to k
    if (prefixCount.has(runningSum - k)) {
      count += prefixCount.get(runningSum - k);
    }

    prefixCount.set(runningSum, (prefixCount.get(runningSum) || 0) + 1);
  }

  return count;
}

console.log(subarraySum([1, 1, 1], 2)); // 2
```

## Example — Longest subarray with sum 0

```javascript
function longestZeroSumSubarray(arr) {
  const firstIndexOfSum = new Map();
  firstIndexOfSum.set(0, -1); // sum of 0 "starts" before index 0

  let runningSum = 0;
  let maxLen = 0;

  for (let i = 0; i < arr.length; i++) {
    runningSum += arr[i];

    if (firstIndexOfSum.has(runningSum)) {
      maxLen = Math.max(maxLen, i - firstIndexOfSum.get(runningSum));
    } else {
      firstIndexOfSum.set(runningSum, i);
    }
  }

  return maxLen;
}

console.log(longestZeroSumSubarray([1, 2, -3, 3, 1])); // 3 -> [1,2,-3]
```

## Complexity

O(n) time, O(n) space — a big improvement over the O(n²) brute force of checking every subarray sum directly.

## Where it shows up

Subarray sum equals K, longest subarray with equal 0s and 1s, continuous subarray sum divisible by K, string hashing for fast substring comparison (Rabin-Karp).
