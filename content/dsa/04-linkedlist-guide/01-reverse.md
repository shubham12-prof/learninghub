# Reverse (Linked List)

Reversing a singly linked list so the last node becomes the head and every `next` pointer flips direction.

## Node definition

```javascript
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}
```

## Iterative — O(n) time, O(1) space

```javascript
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // save next before we overwrite it
    curr.next = prev; // reverse the pointer
    prev = curr; // move prev forward
    curr = nextTemp; // move curr forward
  }

  return prev; // new head
}
```

## Recursive — O(n) time, O(n) space (call stack)

```javascript
function reverseListRecursive(head) {
  if (head === null || head.next === null) return head;

  const newHead = reverseListRecursive(head.next);
  head.next.next = head; // point the next node back at current
  head.next = null; // break the old forward link

  return newHead;
}
```

## Complexity

Iterative: O(n) time, O(1) space — generally preferred.
Recursive: O(n) time, O(n) space due to the call stack.

## Related problem

Reverse a linked list between positions `left` and `right` — same idea, applied only to the sublist.
