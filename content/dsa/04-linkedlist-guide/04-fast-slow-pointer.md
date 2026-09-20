# Fast & Slow Pointer

A two-pointer technique where one pointer moves at a different speed (usually double) than the other. It powers cycle detection, but also several other linked-list tricks.

## Find the middle of a linked list

```javascript
function findMiddle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow; // when fast reaches the end, slow is at the middle
}
```

## Find the Nth node from the end

```javascript
function nthFromEnd(head, n) {
  let fast = head;
  let slow = head;

  // move fast n steps ahead first
  for (let i = 0; i < n; i++) {
    if (fast === null) return null; // list shorter than n
    fast = fast.next;
  }

  while (fast !== null) {
    fast = fast.next;
    slow = slow.next;
  }

  return slow;
}
```

## Check if a linked list is a palindrome

Combines "find middle" + "reverse" + comparison.

```javascript
function isPalindromeList(head) {
  if (head === null || head.next === null) return true;

  // 1. find middle
  let slow = head,
    fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. reverse second half
  let secondHalf = reverseList(slow.next);

  // 3. compare both halves
  let p1 = head,
    p2 = secondHalf;
  let result = true;
  while (p2 !== null) {
    if (p1.val !== p2.val) {
      result = false;
      break;
    }
    p1 = p1.next;
    p2 = p2.next;
  }

  return result;
}
```

## Why "fast & slow" works

The fast pointer covers ground at 2x the rate of the slow pointer. By the time fast finishes traversing the list, slow is exactly halfway — no need to know the list's length in advance, and no extra space needed.

## Complexity

All examples: O(n) time, O(1) space.

## Recognize this pattern when...

The problem mentions "middle of the list," "detect a cycle," "Nth from the end," or "palindrome linked list" — all solvable in a single pass without extra memory.
