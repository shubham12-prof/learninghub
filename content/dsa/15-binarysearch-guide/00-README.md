# Binary Search in JavaScript — Learning Guide

Core binary search patterns for interviews and everyday problem solving.

## Files

1. `01-classic.md`
2. `02-answer-search.md`
3. `03-rotated-array.md`
4. `04-lower-bound.md`
5. `05-upper-bound.md`

## Quick Reference Table

| Pattern       | Time                       | Space | Typical Use Case                                                    |
| ------------- | -------------------------- | ----- | ------------------------------------------------------------------- |
| Classic       | O(log n)                   | O(1)  | Find the exact index of a target in a sorted array                  |
| Answer Search | O(log(range) × check cost) | O(1)  | "Min/max X such that condition holds" (eating speed, capacity)      |
| Rotated Array | O(log n)                   | O(1)  | Search or find minimum in a rotated sorted array                    |
| Lower Bound   | O(log n)                   | O(1)  | First index with value ≥ target (insertion point, first occurrence) |
| Upper Bound   | O(log n)                   | O(1)  | First index with value > target (last occurrence, range counting)   |

## Suggested Practice Order

1. Classic (the foundational template)
2. Lower Bound (adjust the template to find a boundary, not an exact match)
3. Upper Bound (flip one comparison from Lower Bound)
4. Rotated Array (add a "which half is sorted" check)
5. Answer Search (generalize to searching over a range of possible answers)
