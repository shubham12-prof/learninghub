# Prefix Sum

A **prefix sum array** stores the running total up to each index. It lets you answer "sum of range [i, j]" in O(1) after O(n) preprocessing, instead of O(n) per query.

```javascript
function buildPrefixSum(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }
  return prefix; // prefix[i] = sum of arr[0..i-1]
}

function rangeSum(prefix, left, right) {
  // sum of arr[left..right] inclusive
  return prefix[right + 1] - prefix[left];
}

const arr = [2, 4, 6, 8, 10];
const prefix = buildPrefixSum(arr);
console.log(rangeSum(prefix, 1, 3)); // 4+6+8 = 18
```

## Use cases

Range sum queries, subarray sum equals K, equilibrium index problems.

## Complexity

O(n) build, O(1) per query.
