# HashMap in JavaScript — Learning Guide

Core hash-map-based patterns for interviews and everyday problem solving.

## Files

1. `01-frequency-count.md`
2. `02-lookup.md`
3. `03-caching.md`
4. `04-prefix-hash.md`

## Quick Reference Table

| Pattern         | Time     | Space | Typical Use Case                                        |
| --------------- | -------- | ----- | ------------------------------------------------------- |
| Frequency Count | O(n)     | O(n)  | Counting occurrences, most frequent element, duplicates |
| Lookup          | O(1) avg | O(n)  | "Have I seen this?" checks, Two Sum                     |
| Caching         | O(1) avg | O(n)  | Memoization, LRU cache, avoiding recomputation          |
| Prefix Hash     | O(n)     | O(n)  | Subarray sum = K, longest zero-sum subarray             |

## Suggested Practice Order

1. Lookup (the core hash map superpower)
2. Frequency Count (build on lookup)
3. Prefix Hash (combine with prefix sum idea)
4. Caching (apply to recursion/DP)
