# Trie in JavaScript — Learning Guide

Core Trie (prefix tree) operations for interviews and everyday problem solving.

## Files

1. `01-insert.md`
2. `02-search.md`
3. `03-prefix-matching.md`

## Quick Reference Table

| Pattern         | Time        | Space           | Typical Use Case                            |
| --------------- | ----------- | --------------- | ------------------------------------------- |
| Insert          | O(L)        | O(total chars)  | Building the dictionary of words            |
| Search          | O(L)        | O(1) extra      | Checking if an exact word exists            |
| Prefix Matching | O(L)–O(L+n) | O(1)–O(n) extra | Autocomplete, startsWith checks, IP routing |

(L = length of the query string, n = characters in matching results)

## Suggested Practice Order

1. Insert (build the tree structure)
2. Search (exact word lookup, understand `isEndOfWord`)
3. Prefix Matching (generalize to `startsWith` and autocomplete)
