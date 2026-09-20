# Classic (Binary Search)

The fundamental binary search: find the exact index of a target in a sorted array by repeatedly halving the search space.

## Iterative implementation

```javascript
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1; // target is in the right half
    } else {
      right = mid - 1; // target is in the left half
    }
  }

  return -1; // not found
}

console.log(binarySearch([1, 3, 5, 7, 9, 11], 7)); // 3
console.log(binarySearch([1, 3, 5, 7, 9, 11], 4)); // -1
```

## Recursive implementation

```javascript
function binarySearchRecursive(
  nums,
  target,
  left = 0,
  right = nums.length - 1,
) {
  if (left > right) return -1;

  const mid = Math.floor((left + right) / 2);

  if (nums[mid] === target) return mid;
  if (nums[mid] < target)
    return binarySearchRecursive(nums, target, mid + 1, right);
  return binarySearchRecursive(nums, target, left, mid - 1);
}
```

## Watch out for the overflow-prone midpoint formula

`Math.floor((left + right) / 2)` is fine in JavaScript (numbers don't overflow the way they do in fixed-width integer languages), but the safer general habit — especially if translating to other languages — is:

```javascript
const mid = left + Math.floor((right - left) / 2);
```

## Complexity

O(log n) time, O(1) space (iterative) or O(log n) space (recursive, call stack).

## Recognize this pattern when...

The input is sorted (or can be framed as sorted) and you need to find a specific value — this is the baseline every other binary search variant builds on.
