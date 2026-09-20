# Anagram

Two strings are anagrams if they contain the same characters with the same frequencies, just rearranged (e.g. "listen" and "silent").

## Approach 1 — Sorting

```javascript
function isAnagramSort(a, b) {
  if (a.length !== b.length) return false;
  const sortStr = (s) => s.split("").sort().join("");
  return sortStr(a) === sortStr(b);
}

console.log(isAnagramSort("listen", "silent")); // true
```

Time: O(n log n) due to sorting.

## Approach 2 — Frequency Count (optimal)

```javascript
function isAnagram(a, b) {
  if (a.length !== b.length) return false;

  const counts = {};

  for (const ch of a) {
    counts[ch] = (counts[ch] || 0) + 1;
  }

  for (const ch of b) {
    if (!counts[ch]) return false; // missing or already used up
    counts[ch]--;
  }

  return true;
}

console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car")); // false
```

## Complexity

Sorting approach: O(n log n) time, O(n) space.
Frequency count approach: O(n) time, O(1) space (bounded alphabet, e.g. 26 lowercase letters).

## Related problem

Group Anagrams: bucket words by their sorted-string (or frequency-signature) key using a `Map`.
