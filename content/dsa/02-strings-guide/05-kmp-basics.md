# KMP Basics (Knuth-Morris-Pratt)

An efficient pattern-matching algorithm that avoids re-checking characters it has already matched, by precomputing a "failure function" (a.k.a. LPS array — Longest Prefix that is also a Suffix).

## Step 1 — Build the LPS (Longest Prefix Suffix) array

`lps[i]` = length of the longest proper prefix of `pattern[0..i]` that is also a suffix of it.

```javascript
function buildLPS(pattern) {
  const lps = new Array(pattern.length).fill(0);
  let len = 0; // length of the previous longest prefix-suffix
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else if (len > 0) {
      len = lps[len - 1]; // fall back, don't advance i
    } else {
      lps[i] = 0;
      i++;
    }
  }

  return lps;
}
```

## Step 2 — Search using the LPS array

```javascript
function kmpSearch(text, pattern) {
  const lps = buildLPS(pattern);
  const matches = [];
  let i = 0; // pointer in text
  let j = 0; // pointer in pattern

  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === pattern.length) {
        matches.push(i - j); // match found
        j = lps[j - 1];
      }
    } else if (j > 0) {
      j = lps[j - 1]; // use LPS to skip re-comparisons
    } else {
      i++;
    }
  }

  return matches;
}

console.log(kmpSearch("ababcababc", "abc")); // [2, 7]
```

## Why it's faster than naive search

On a mismatch, naive search restarts the pattern pointer from 0. KMP uses the LPS array to know how much of the pattern it can safely skip re-checking, so the text pointer never moves backward.

## Complexity

O(n + m) time (n = text length, m = pattern length), O(m) space for the LPS array — a big improvement over naive O(n·m).
