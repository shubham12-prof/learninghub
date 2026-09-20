# Strings in JavaScript — Learning Guide

Core string algorithm patterns for interviews and everyday problem solving.

## Files

1. `01-palindrome.md`
2. `02-anagram.md`
3. `03-pattern-matching.md`
4. `04-sliding-window.md`
5. `05-kmp-basics.md`

## Quick Reference Table

| Pattern          | Time     | Space  | Typical Use Case                                 |
| ---------------- | -------- | ------ | ------------------------------------------------ |
| Palindrome       | O(n)     | O(1)   | Checking symmetry, longest palindromic substring |
| Anagram          | O(n)     | O(1)\* | Comparing character compositions                 |
| Pattern Matching | O(n·m)   | O(1)   | Naive substring search                           |
| Sliding Window   | O(n)     | O(k)   | Longest/shortest substring with a condition      |
| KMP Basics       | O(n + m) | O(m)   | Efficient substring search, avoids re-checking   |

\* bounded alphabet size (e.g. 26 lowercase letters)

## Suggested Practice Order

1. Palindrome (warm-up, two pointers)
2. Anagram (frequency counting intro)
3. Pattern Matching (naive search baseline)
4. Sliding Window (build on two pointers)
5. KMP Basics (optimize pattern matching)
