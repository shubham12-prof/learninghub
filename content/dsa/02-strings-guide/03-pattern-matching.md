# Pattern Matching

Finding whether (and where) a pattern string occurs inside a text string.

## Naive / Brute Force — O(n·m)

Check every possible starting position in the text.

```javascript
function naiveSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const matches = [];

  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) {
      j++;
    }
    if (j === m) matches.push(i); // full match found at index i
  }

  return matches;
}

console.log(naiveSearch("ababcababc", "abc")); // [2, 7]
```

## Built-in helpers (fine for one-off / non-performance-critical use)

```javascript
"hello world".includes("world"); // true
"hello world".indexOf("world"); // 6
/wor.d/.test("hello world"); // true — regex pattern matching
```

## Complexity

Naive search: O(n·m) worst case (n = text length, m = pattern length).

## When naive isn't enough

For large texts or repeated searches, use a smarter algorithm — see `05-kmp-basics.md` for O(n + m) matching.
