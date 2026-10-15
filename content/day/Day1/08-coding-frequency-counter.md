# 08 - Coding: Frequency Counter

> **Time to learn:** ~30 min | **Difficulty:** Easy to Medium | **Interview frequency:** Very high

## 1. The problem

Write a function that counts **how many times each item appears** in a string or array.

```js
charFrequency("hello");
// { h: 1, e: 1, l: 2, o: 1 }

countItems(["a", "b", "a", "c", "a"]);
// { a: 3, b: 1, c: 1 }
```

This is one of the most useful patterns in coding interviews. It solves anagrams, duplicates, "most common element", "first unique character" and many more problems in **O(n)** time.

## 2. The pattern

1. Create an empty object (or `Map`).
2. Loop over the input once.
3. For each item: `count[item] = (count[item] || 0) + 1`.
4. Use the counts to answer the question.

## 3. Solutions

### Solution 1: Object + `for...of` (the standard answer)

```js
function charFrequency(str) {
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  return freq;
}

charFrequency("hello"); // { h: 1, e: 1, l: 2, o: 1 }
```

How it works: if `freq[ch]` doesn't exist yet it's `undefined`, so `undefined || 0` gives `0`, then `+ 1`.

- Time: **O(n)** | Space: **O(k)** where k = number of distinct items

### Solution 2: `Map` (safer and keeps insertion order)

```js
function charFrequency(str) {
  const freq = new Map();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  return freq;
}

charFrequency("hello"); // Map(4) { 'h' => 1, 'e' => 1, 'l' => 2, 'o' => 1 }
```

Why `Map` can be better:
- Keys can be any type (numbers stay numbers, not strings).
- No prototype problems (see the warning below).
- Easy size with `freq.size`.

### Solution 3: `reduce`

```js
function charFrequency(str) {
  return [...str].reduce((freq, ch) => {
    freq[ch] = (freq[ch] || 0) + 1;
    return freq;
  }, {});
}
```

### Solution 4: Count an array

The same logic works for any array:

```js
function countItems(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return counts;
}

countItems([1, 2, 2, 3, 3, 3]); // { '1': 1, '2': 2, '3': 3 }
```

Note: object keys are always strings, so `1` becomes `"1"`.

### Warning: the prototype trap

A plain `{}` inherits properties like `constructor` and `toString`. This breaks the counter for those words:

```js
const freq = {};
const word = "constructor";
freq[word] = (freq[word] || 0) + 1;
console.log(freq[word]); // "function Object() { [native code] }1"  <- bug!
```

Fixes:

```js
const freq = Object.create(null);      // object with NO prototype
// or
const freq = new Map();                // recommended for word counting
```

## 4. Using the counts

### Most frequent character

```js
function mostFrequent(str) {
  const freq = new Map();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  let maxChar = "";
  let maxCount = 0;
  for (const [ch, count] of freq) {
    if (count > maxCount) {
      maxChar = ch;
      maxCount = count;
    }
  }
  return { char: maxChar, count: maxCount };
}

mostFrequent("javascript"); // { char: 'a', count: 2 }
```

(If there is a tie, this returns the one that appeared first.)

### Valid anagram

Two strings are anagrams if they contain the same letters with the same counts.

```js
function isAnagram(a, b) {
  if (a.length !== b.length) return false;

  const freq = new Map();
  for (const ch of a) freq.set(ch, (freq.get(ch) ?? 0) + 1);

  for (const ch of b) {
    if (!freq.get(ch)) return false;   // missing or already used up
    freq.set(ch, freq.get(ch) - 1);
  }
  return true;
}

isAnagram("listen", "silent"); // true
isAnagram("rat", "car");       // false
```

- Time: **O(n)** vs the sorting approach `a.split("").sort().join("") === b.split("").sort().join("")` which is O(n log n).

### First non-repeating character

```js
function firstUnique(str) {
  const freq = new Map();
  for (const ch of str) freq.set(ch, (freq.get(ch) ?? 0) + 1);

  for (const ch of str) {
    if (freq.get(ch) === 1) return ch;
  }
  return null;
}

firstUnique("swiss");  // "w"
firstUnique("aabb");   // null
```

Two passes: one to count, one to find. Still O(n).

### Word frequency

```js
function wordFrequency(text) {
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

wordFrequency("The cat and the hat"); 
// Map { 'the' => 2, 'cat' => 1, 'and' => 1, 'hat' => 1 }
```

### Sort by frequency

```js
const freq = charFrequency("mississippi"); // { m:1, i:4, s:4, p:2 }

const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
// [ ['i', 4], ['s', 4], ['p', 2], ['m', 1] ]
```

## 5. Edge cases to mention

| Input | Expected |
|---|---|
| `""` | `{}` |
| `"aA"` | `{ a: 1, A: 1 }` (case-sensitive unless you normalise with `toLowerCase()`) |
| `"a b"` | space is counted as a character (filter it if needed) |
| `"😀😀"` | `{ "😀": 2 }` works with `for...of` (code points) |
| `[1, "1"]` with an object | both become key `"1"` -> use `Map` |
| Non-string / null input | validate first |

## 6. Which one should I use in an interview?

1. Use an **object** for a quick, readable answer, and say the complexity is O(n).
2. Mention `Map` for non-string keys and to avoid prototype problems.
3. Show how the counter is the key idea behind anagrams and first-unique-character problems.

## 7. Practice variations

1. Find the **most frequent word** in a sentence.
2. Check if two arrays contain the **same elements with the same counts**.
3. Find characters that appear **more than once**.
4. Given an array, find the element that appears **more than n/2 times** (majority element).
5. **Group anagrams:** `["eat","tea","tan","ate","nat","bat"]` -> `[["eat","tea","ate"],["tan","nat"],["bat"]]`.
6. Find the **first duplicate** number in an array in O(n).

### Hints / answers

```js
// 1. Most frequent word
function mostFrequentWord(text) {
  const freq = wordFrequency(text);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// 2. Same elements, same counts
function sameCounts(a, b) {
  if (a.length !== b.length) return false;
  const freq = new Map();
  for (const x of a) freq.set(x, (freq.get(x) ?? 0) + 1);
  for (const x of b) {
    if (!freq.get(x)) return false;
    freq.set(x, freq.get(x) - 1);
  }
  return true;
}

// 3. Characters that appear more than once
function repeatedChars(str) {
  const freq = new Map();
  for (const ch of str) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  return [...freq].filter(([, n]) => n > 1).map(([ch]) => ch);
}

// 4. Majority element (frequency counter version)
function majority(arr) {
  const freq = new Map();
  for (const x of arr) {
    const n = (freq.get(x) ?? 0) + 1;
    freq.set(x, n);
    if (n > arr.length / 2) return x;
  }
  return null;
}

// 5. Group anagrams
function groupAnagrams(words) {
  const groups = new Map();
  for (const w of words) {
    const key = [...w].sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return [...groups.values()];
}

// 6. First duplicate
function firstDuplicate(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return x;
    seen.add(x);
  }
  return -1;
}
```

## Recap

- Frequency counter = one pass, `count[item] = (count[item] || 0) + 1`.
- Turns many O(n^2) problems into O(n).
- Prefer `Map` when keys aren't plain strings or could clash with prototype names.
- Powers anagrams, first unique character, majority element and grouping problems.

## Checklist

- [ ] I can write the counter without looking
- [ ] I can explain why `Map` can be safer than `{}`
- [ ] I can solve anagram and first-unique-character with it
- [ ] I solved all 6 practice variations
