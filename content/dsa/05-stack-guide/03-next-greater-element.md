# Next Greater Element

For each element in an array, find the first element to its right (or in a circular sense) that is greater than it. A textbook use case for a monotonic decreasing stack.

## Standard version — O(n)

```javascript
function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // stores indices, values at those indices are decreasing

  for (let i = 0; i < nums.length; i++) {
    // current number is greater than the one on top of the stack
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }

  return result; // indices left on the stack have no greater element -> stay -1
}

console.log(nextGreaterElement([2, 1, 2, 4, 3]));
// [4, 2, 4, -1, -1]
```

## Circular version — array wraps around

```javascript
function nextGreaterElementsCircular(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = [];

  // loop twice over the array to simulate circularity
  for (let i = 0; i < 2 * n; i++) {
    const num = nums[i % n];

    while (stack.length > 0 && num > nums[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = num;
    }

    if (i < n) stack.push(i);
  }

  return result;
}

console.log(nextGreaterElementsCircular([1, 2, 1]));
// [2, -1, 2]
```

## Why the stack stays decreasing

You only push an index when you don't yet know its next greater element. As soon as a bigger number shows up, every smaller number sitting on the stack gets "resolved" and popped — so the stack always holds indices waiting for their answer, in decreasing order of value.

## Complexity

O(n) time (each index pushed/popped once), O(n) space.

## Related problems

Next Smaller Element (flip the comparison), Previous Greater Element (iterate right to left), Stock Span Problem.
