# Detect Cycle

Determine whether a linked list has a cycle (a node's `next` eventually loops back to a previous node instead of ending in `null`).

## Floyd's Cycle Detection (Fast & Slow Pointer / "Tortoise and Hare")

```javascript
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next; // moves 1 step
    fast = fast.next.next; // moves 2 steps

    if (slow === fast) return true; // they meet -> cycle exists
  }

  return false; // fast reached the end -> no cycle
}
```

## Finding where the cycle starts

Once `slow` and `fast` meet, reset one pointer to `head` and move both one step at a time — they'll meet again exactly at the start of the cycle.

```javascript
function detectCycleStart(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) break;
  }

  if (fast === null || fast.next === null) return null; // no cycle

  slow = head;
  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next;
  }

  return slow; // the node where the cycle begins
}
```

## Why it works

If there's a cycle, the fast pointer (moving 2x speed) will eventually "lap" the slow pointer inside the loop — they're guaranteed to meet. If there's no cycle, fast simply reaches `null` first.

## Complexity

O(n) time, O(1) space — much better than using a hash set to track visited nodes (which is O(n) space).
