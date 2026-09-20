# Dynamic Programming in JavaScript — Learning Guide

Core dynamic programming patterns for interviews and everyday problem solving.

## Files

1. `01-memoization.md`
2. `02-tabulation.md`
3. `03-knapsack.md`
4. `04-lis.md`

## Quick Reference Table

| Pattern     | Time                | Space            | Typical Use Case                                     |
| ----------- | ------------------- | ---------------- | ---------------------------------------------------- |
| Memoization | O(subproblems)      | O(subproblems)   | Top-down recursion with overlapping subproblems      |
| Tabulation  | O(subproblems)      | O(subproblems)\* | Bottom-up, avoids recursion/call stack risk          |
| Knapsack    | O(n × capacity)     | O(capacity)\*    | Item selection under a constraint (weight/budget)    |
| LIS         | O(n²) or O(n log n) | O(n)             | Longest increasing subsequence and its many variants |

\* often reducible with space optimization (rolling array / single array)

## Suggested Practice Order

1. Memoization (get comfortable identifying overlapping subproblems)
2. Tabulation (convert the same problems to bottom-up)
3. Knapsack (2D state, the classic DP table problem)
4. LIS (1D state with a twist — O(n log n) optimization)
