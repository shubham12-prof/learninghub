# Palindrome

A palindrome is a string that reads the same forwards and backwards (e.g. "racecar", "level").

## Two-pointer check — O(n) time, O(1) space

```javascript
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;

  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }

  return true;
}

console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("hello")); // false
```

## Ignoring case and non-alphanumeric characters

```javascript
function isPalindromeClean(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++;
    right--;
  }

  return true;
}

console.log(isPalindromeClean("A man, a plan, a canal: Panama")); // true
```

## Longest Palindromic Substring — "expand around center" (common interview follow-up)

```javascript
function longestPalindrome(s) {
  let start = 0,
    maxLen = 0;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    const len = right - left - 1;
    if (len > maxLen) {
      maxLen = len;
      start = left + 1;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i); // odd-length palindromes
    expand(i, i + 1); // even-length palindromes
  }

  return s.substring(start, start + maxLen);
}

console.log(longestPalindrome("babad")); // "bab" or "aba"
```

## Complexity

Basic check: O(n) time, O(1) space.
Longest palindromic substring (expand around center): O(n²) time, O(1) space.
