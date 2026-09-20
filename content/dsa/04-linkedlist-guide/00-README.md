# Linked Lists in JavaScript — Learning Guide

Core linked-list patterns for interviews and everyday problem solving.

## Files

1. `01-reverse.md`
2. `02-detect-cycle.md`
3. `03-merge.md`
4. `04-fast-slow-pointer.md`

## Quick Reference Table

| Pattern             | Time   | Space  | Typical Use Case                                   |
| ------------------- | ------ | ------ | -------------------------------------------------- |
| Reverse             | O(n)   | O(1)\* | Reversing a list or sublist                        |
| Detect Cycle        | O(n)   | O(1)   | Determining if a list loops back on itself         |
| Merge               | O(n+m) | O(1)\* | Combining sorted lists, merge sort on linked lists |
| Fast & Slow Pointer | O(n)   | O(1)   | Middle node, Nth from end, palindrome check        |

\* iterative versions; recursive versions use O(n) call stack space

## Suggested Practice Order

1. Reverse (fundamental pointer manipulation)
2. Fast & Slow Pointer (find middle, Nth from end)
3. Detect Cycle (apply fast & slow pointer)
4. Merge (combine two lists, then try K lists)
