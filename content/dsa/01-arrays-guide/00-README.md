# Arrays in JavaScript — Learning Guide

A practical walkthrough of the core array patterns every JS developer (and interview candidate) should know.

## Files

1. `01-traversal.md`
2. `02-prefix-sum.md`
3. `03-kadane.md`
4. `04-rotation.md`
5. `05-merge.md`
6. `06-two-sum.md`

## Quick Reference Table

| Pattern    | Time                   | Space  | Typical Use Case                    |
| ---------- | ---------------------- | ------ | ----------------------------------- |
| Traversal  | O(n)                   | O(1)   | Visiting/processing each element    |
| Prefix Sum | O(n) build, O(1) query | O(n)   | Range sum queries, subarray sum = K |
| Kadane's   | O(n)                   | O(1)   | Max subarray sum                    |
| Rotation   | O(n)                   | O(1)\* | Shifting elements circularly        |
| Merge      | O(n+m)                 | O(n+m) | Combining sorted arrays, merge sort |
| Two Sum    | O(n)                   | O(n)   | Pair lookup with target sum         |

\* using the in-place reversal technique

## Suggested Practice Order

1. Traversal (warm-up)
2. Two Sum (intro to hash maps)
3. Prefix Sum (build on traversal)
4. Merge (two-pointer technique)
5. Rotation (in-place manipulation)
6. Kadane's (dynamic programming intuition)
