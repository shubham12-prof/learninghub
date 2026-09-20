# Merge (Linked Lists)

Combine two sorted linked lists into a single sorted linked list — the linked-list counterpart to array merging.

## Iterative — using a dummy head node

```javascript
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy;

  while (l1 !== null && l2 !== null) {
    if (l1.val <= l2.val) {
      tail.next = l1;
      l1 = l1.next;
    } else {
      tail.next = l2;
      l2 = l2.next;
    }
    tail = tail.next;
  }

  // attach whichever list has leftovers
  tail.next = l1 !== null ? l1 : l2;

  return dummy.next; // skip the dummy node
}
```

## Recursive

```javascript
function mergeTwoListsRecursive(l1, l2) {
  if (l1 === null) return l2;
  if (l2 === null) return l1;

  if (l1.val <= l2.val) {
    l1.next = mergeTwoListsRecursive(l1.next, l2);
    return l1;
  } else {
    l2.next = mergeTwoListsRecursive(l1, l2.next);
    return l2;
  }
}
```

## Merging K sorted lists

Use a min-heap (priority queue) of size K, or divide-and-conquer by merging pairs of lists repeatedly.

```javascript
function mergeKLists(lists) {
  if (lists.length === 0) return null;

  while (lists.length > 1) {
    const merged = [];
    for (let i = 0; i < lists.length; i += 2) {
      const l1 = lists[i];
      const l2 = lists[i + 1] || null;
      merged.push(mergeTwoLists(l1, l2));
    }
    lists = merged;
  }

  return lists[0];
}
```

## Complexity

Merge two lists: O(n + m) time, O(1) space (iterative) or O(n + m) space (recursive, call stack).
Merge K lists (divide-and-conquer): O(N log K) time, where N is total nodes across all lists.

## The "dummy node" trick

A placeholder node before the real head avoids messy special-casing of "is this the first node?" — very common in linked list problems.
