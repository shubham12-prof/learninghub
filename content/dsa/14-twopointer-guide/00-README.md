# Two Pointer in JavaScript — Learning Guide

Core two-pointer patterns for interviews and everyday problem solving.

## Files

1. `01-opposite-direction.md`
2. `02-fast-slow-pointer.md`

## Quick Reference Table

| Pattern             | Time               | Space | Typical Use Case                                                          |
| ------------------- | ------------------ | ----- | ------------------------------------------------------------------------- |
| Opposite Direction  | O(n) or O(n log n) | O(1)  | Two Sum (sorted), palindrome check, container with most water, 3Sum       |
| Fast & Slow Pointer | O(n)               | O(1)  | Linked list cycle/middle, in-place array compaction (dedupe, move zeroes) |

## Suggested Practice Order

1. Opposite Direction (narrowing in from both ends of a sorted structure)
2. Fast & Slow Pointer (same-direction, different speeds)
