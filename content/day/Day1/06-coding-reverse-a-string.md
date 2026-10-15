# 06 - Coding: Reverse a String

> **Time to learn:** ~25 min | **Difficulty:** Easy | **Interview frequency:** Very high (warm-up question)

## 1. The problem

Write a function `reverseString(str)` that returns the string reversed.

```js
reverseString("hello");   // "olleh"
reverseString("");        // ""
reverseString("a");       // "a"
reverseString("JS rocks") // "skcor SJ"
```

## 2. How to think about it

- Strings are **immutable** in JavaScript. You cannot swap characters in place, so you always build a **new** string (or convert to an array first).
- Reversing means: last character first, first character last.
- Always ask the interviewer: *"Should I handle Unicode / emojis? Should I mutate in place?"* Asking shows maturity.

## 3. Solutions (simple -> advanced)

### Solution 1: Built-in methods (the one-liner)

```js
function reverseString(str) {
  return str.split("").reverse().join("");
}
```

How it works:

```
"hello" -> split("") -> ["h","e","l","l","o"]
        -> reverse() -> ["o","l","l","e","h"]
        -> join("")  -> "olleh"
```

- Time: **O(n)** | Space: **O(n)**
- Pros: shortest, most readable. Cons: interviewers often follow up with "now do it without built-ins".

### Solution 2: `for` loop (backwards)

```js
function reverseString(str) {
  let result = "";
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}
```

- Time: **O(n)** | Space: **O(n)**
- Pros: no built-ins, easy to explain.

### Solution 3: `for...of` loop (prepend)

```js
function reverseString(str) {
  let result = "";
  for (const char of str) {
    result = char + result; // add each character to the FRONT
  }
  return result;
}
```

- Time: **O(n)** in practice (engines optimise string concatenation) | Space: **O(n)**
- Bonus: `for...of` iterates by code point, so it handles emojis better than indexing.

### Solution 4: `reduce`

```js
function reverseString(str) {
  return [...str].reduce((rev, char) => char + rev, "");
}
```

- Time: **O(n)** | Space: **O(n)**

### Solution 5: Recursion

```js
function reverseString(str) {
  if (str === "") return "";                       // base case
  return reverseString(str.slice(1)) + str[0];     // reverse the rest, then add first char at the end
}
```

Trace for `"abc"`:

```
reverse("abc") = reverse("bc") + "a"
               = (reverse("c") + "b") + "a"
               = ((reverse("") + "c") + "b") + "a"
               = (("" + "c") + "b") + "a" = "cba"
```

- Time: **O(n)** (but `slice` copies, so can be O(n^2) in theory) | Space: **O(n)** call stack
- Cons: a very long string will cause a stack overflow. Good for showing recursion knowledge, not for production.

### Solution 6: Two-pointer swap (classic algorithm)

Strings can't be changed in place, so convert to an array, swap from both ends, and join.

```js
function reverseString(str) {
  const chars = [...str];
  let left = 0;
  let right = chars.length - 1;

  while (left < right) {
    [chars[left], chars[right]] = [chars[right], chars[left]]; // swap
    left++;
    right--;
  }

  return chars.join("");
}
```

- Time: **O(n)** | Space: **O(n)** (the array)
- This is the "in-place" pattern you'd use if the input were an array of characters (a very common interview variation).

## 4. Edge cases to mention

| Input | Expected | Notes |
|---|---|---|
| `""` | `""` | Empty string |
| `"a"` | `"a"` | Single character |
| `"  hi "` | `" ih  "` | Spaces are kept |
| `"Ab"` | `"bA"` | Case is preserved |
| `123` (number) | depends | Validate input: `typeof str !== "string"` -> throw or convert with `String(str)` |
| `"😀ab"` | `"ba😀"` | **Unicode trap**, see below |

### The Unicode trap

`split("")` splits by UTF-16 code units, which **breaks emojis** (they use 2 units):

```js
"😀ab".split("").reverse().join(""); // "ba\uDE00\uD83D" -> broken emoji
[..."😀ab"].reverse().join("");      // "ba😀" -> correct
```

The spread operator `[...str]` and `for...of` iterate by **code points**, so they are safer. (Some emojis made of several code points, like family or flag emojis, still need `Intl.Segmenter` to handle properly. Mentioning this in an interview is a bonus.)

### A safe, validated version

```js
function reverseString(str) {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }
  return [...str].reverse().join("");
}
```

## 5. Which one should I use in an interview?

1. Start with **Solution 1** to show you know the language.
2. When asked for "without built-ins", show **Solution 2** or **Solution 6**.
3. If asked about recursion, show **Solution 5** and mention the stack limit.
4. Mention the **Unicode** caveat and use `[...str]`.

## 6. Practice variations

Try each yourself before looking up answers.

1. **Palindrome check:** is `"racecar"` equal to its reverse? Ignore case and non-letters (`"A man, a plan, a canal: Panama"` -> true).
2. **Reverse the words** in a sentence: `"I love JS"` -> `"JS love I"`.
3. **Reverse each word** but keep the word order: `"I love JS"` -> `"I evol SJ"`.
4. **Reverse only the vowels** in a string: `"hello"` -> `"holle"`.
5. **Reverse an array in place** without using `.reverse()`.

### Hints / answers

```js
// 1. Palindrome
const isPalindrome = (s) => {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === [...clean].reverse().join("");
};

// 2. Reverse the words
const reverseWords = (s) => s.split(" ").reverse().join(" ");

// 3. Reverse each word
const reverseEachWord = (s) =>
  s.split(" ").map((w) => [...w].reverse().join("")).join(" ");

// 4. Reverse vowels (two pointers)
function reverseVowels(s) {
  const vowels = new Set("aeiouAEIOU");
  const chars = [...s];
  let l = 0, r = chars.length - 1;
  while (l < r) {
    if (!vowels.has(chars[l])) l++;
    else if (!vowels.has(chars[r])) r--;
    else {
      [chars[l], chars[r]] = [chars[r], chars[l]];
      l++; r--;
    }
  }
  return chars.join("");
}

// 5. Reverse an array in place
function reverseArray(arr) {
  for (let i = 0, j = arr.length - 1; i < j; i++, j--) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

## Recap

- Strings are immutable: build a new one or use an array.
- Easiest: `split("").reverse().join("")`. Safer for Unicode: `[...str]`.
- Know a loop version, a recursive version and a two-pointer version.
- Complexity is O(n) time and O(n) space for all of them.
- Mention edge cases: empty string, single char, non-string input, emojis.

## Checklist

- [ ] I can write the one-liner from memory
- [ ] I can write the loop and recursive versions
- [ ] I can explain why `split("")` breaks emojis
- [ ] I solved all 5 practice variations
