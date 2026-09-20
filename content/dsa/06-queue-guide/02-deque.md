# Deque (Double-Ended Queue)

A queue that supports insertion and removal from **both** ends in O(1) time. More flexible than a regular queue or stack — it can act as either.

## Implementation (using a doubly linked list under the hood)

JS doesn't have a built-in deque, but you can simulate one efficiently. For most interview purposes, a plain array with `push`/`pop`/`shift`/`unshift` is fine unless performance on large inputs matters (array `shift`/`unshift` are O(n)).

```javascript
class Deque {
  constructor() {
    this.items = [];
  }

  addFront(value) {
    this.items.unshift(value);
  }
  addRear(value) {
    this.items.push(value);
  }
  removeFront() {
    return this.items.shift();
  }
  removeRear() {
    return this.items.pop();
  }
  peekFront() {
    return this.items[0];
  }
  peekRear() {
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
}
```

## Classic use case — Sliding Window Maximum

Maintain a deque of _indices_, keeping it monotonically decreasing by value, so the front always holds the index of the current window's maximum.

```javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices, values decreasing
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // remove indices that are out of the current window
    if (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // remove indices whose values are smaller than the current one
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    if (i >= k - 1) result.push(nums[deque[0]]);
  }

  return result;
}

console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3));
// [3, 3, 5, 5, 6, 7]
```

## Complexity

Basic operations: O(1) with a proper linked-list-backed deque.
Sliding Window Maximum: O(n) time overall (each index pushed/popped once), O(k) space.

## Where it shows up

Sliding window maximum/minimum, palindrome checks, browser history (back/forward), undo-redo systems.
