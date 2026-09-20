# Sliding Window in JavaScript — Learning Guide

Core sliding window patterns for interviews and everyday problem solving.

## Files

1. `01-fixed-window.md`
2. `02-variable-window.md`

## Quick Reference Table

| Pattern         | Time | Space               | Typical Use Case                                           |
| --------------- | ---- | ------------------- | ---------------------------------------------------------- |
| Fixed Window    | O(n) | O(1)–O(k)           | Max/min/average of every window of a constant size k       |
| Variable Window | O(n) | O(k) or O(alphabet) | Longest/shortest substring or subarray meeting a condition |

## Suggested Practice Order

1. Fixed Window (simplest: slide, add new, remove old)
2. Variable Window (grow/shrink based on a validity condition)
