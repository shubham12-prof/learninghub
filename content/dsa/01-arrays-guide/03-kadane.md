# Kadane's Algorithm (Maximum Subarray Sum)

Finds the contiguous subarray with the largest sum, in a single pass.

**Core idea:** at each index, decide whether to extend the previous subarray or start fresh from the current element.

```javascript
function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let maxEndingHere = nums[0];

  for (let i = 1; i < nums.length; i++) {
    // either extend the running sum, or start over at nums[i]
    maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6 -> [4, -1, 2, 1]
```

## Complexity

O(n) time, O(1) space.

## Tip

If you also need the actual subarray (not just the sum), track the start/end indices when `maxEndingHere` resets or `maxSoFar` updates.
