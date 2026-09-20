# Fixed Window

A sliding window whose size `k` stays constant throughout the scan. You compute the result for the first window, then slide one step at a time — removing the element leaving the window and adding the element entering it, so you never recompute from scratch.

## Max sum of any window of size k

```javascript
function maxWindowSum(arr, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];

  let maxSum = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // add new element, remove element leaving the window
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

console.log(maxWindowSum([2, 1, 5, 1, 3, 2], 3)); // 9 -> [5, 1, 3]
```

## Average of every window of size k

```javascript
function windowAverages(arr, k) {
  const result = [];
  let windowSum = 0;

  for (let i = 0; i < arr.length; i++) {
    windowSum += arr[i];

    if (i >= k - 1) {
      result.push(windowSum / k);
      windowSum -= arr[i - k + 1]; // remove the element that's about to leave the window
    }
  }

  return result;
}

console.log(windowAverages([1, 3, 2, 6, -1, 4, 1, 8, 2], 5));
// [2.2, 2.8, 2.4, 3.6, 2.8]
```

## Max of every window of size k (using a Deque — see the Queue guide for full explanation)

```javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices, values decreasing
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    if (deque.length > 0 && deque[0] <= i - k) deque.shift();

    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    if (i >= k - 1) result.push(nums[deque[0]]);
  }

  return result;
}
```

## Why this beats brute force

Brute force recomputes the sum/average/max for every window from scratch: O(n·k). Sliding the window and updating incrementally does each element's work once: O(n).

## Complexity

Sum/average: O(n) time, O(1) space.
Max/min (deque-based): O(n) time, O(k) space.

## Recognize this pattern when...

The problem specifies a **fixed** window size k and asks for something computed per window (sum, average, max, count of distinct elements, etc.).
