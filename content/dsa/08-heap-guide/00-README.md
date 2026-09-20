# Heap in JavaScript — Learning Guide

Core heap-based patterns for interviews and everyday problem solving.

## Files

1. `01-min-heap.md`
2. `02-max-heap.md`
3. `03-priority-queue.md`

## Quick Reference Table

| Pattern        | Push/Enqueue | Pop/Dequeue | Peek | Typical Use Case                                 |
| -------------- | ------------ | ----------- | ---- | ------------------------------------------------ |
| Min Heap       | O(log n)     | O(log n)    | O(1) | Kth smallest, Dijkstra, merging sorted lists     |
| Max Heap       | O(log n)     | O(log n)    | O(1) | Kth largest, running median (paired w/ min heap) |
| Priority Queue | O(log n)     | O(log n)    | O(1) | Task scheduling, top-K, A\*/Dijkstra             |

## Suggested Practice Order

1. Min Heap (core push/pop mechanics)
2. Max Heap (flip the comparisons, or negate trick)
3. Priority Queue (generalize to custom comparators and real objects)
