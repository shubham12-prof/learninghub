# Fast & Slow Pointer

Both pointers move in the **same direction**, but at different speeds — usually the fast pointer moves twice as fast as the slow one. Most associated with linked lists, but the same idea applies to arrays too (e.g. removing duplicates in place).

## Cycle Detection (Linked List) — Floyd's Algorithm

```javascript
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // they meet -> cycle exists
  }

  return false;
}
```

## Find the Middle of a Linked List

```javascript
function findMiddle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow; // when fast reaches the end, slow sits at the middle
}
```

## Array version — Remove Duplicates from a Sorted Array in place

```javascript
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // slow marks the last position of a unique element

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast]; // write the new unique value forward
    }
  }

  return slow + 1; // length of the unique portion
}

const arr = [1, 1, 2, 2, 3, 4, 4];
const newLength = removeDuplicates(arr);
console.log(newLength, arr.slice(0, newLength)); // 4 [1, 2, 3, 4]
```

## Array version — Move Zeroes to the end

```javascript
function moveZeroes(nums) {
  let slow = 0; // slow marks where the next non-zero value should go

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }

  return nums;
}

console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]
```

## Why "fast & slow" (not opposite direction) here

These problems need to compress, detect a loop, or find a midpoint — all of which require one pointer to "get ahead" of the other while scanning in a single direction, rather than narrowing in from both ends.

## Complexity

All examples: O(n) time, O(1) space.

## Recognize this pattern when...

The problem involves in-place array compaction (remove duplicates/elements), or a linked list needing cycle detection, middle-finding, or Nth-from-end logic.
