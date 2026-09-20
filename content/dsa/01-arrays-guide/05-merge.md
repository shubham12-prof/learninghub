# Merge (Two Sorted Arrays)

Combine two sorted arrays into one sorted array — the backbone of merge sort.

```javascript
function mergeSorted(a, b) {
  const result = [];
  let i = 0,
    j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i++]);
    } else {
      result.push(b[j++]);
    }
  }

  // push any leftovers
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);

  return result;
}

console.log(mergeSorted([1, 3, 5], [2, 4, 6])); // [1, 2, 3, 4, 5, 6]
```

## Complexity

O(n + m) time, O(n + m) space.

## Where it shows up

Merge sort, LeetCode "Merge Sorted Array" (in-place variant merges from the back to avoid overwriting).
