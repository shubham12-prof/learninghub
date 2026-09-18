/*
  Top 30 - #1: Reverse String

  PROBLEM: reverse a string. Example: "hello" -> "olleh"
  */

// Easiest way: convert to array, reverse, join back.
function reverseString(str) {
  return str.split("").reverse().join("");
}

console.log(reverseString("hello")); // "olleh"

//Using for loop
function reverse(str) {
  let chars = "";
  for (let i = str.length - 1; i >= 0; i--) {
    chars += str[i]
  }
  return chars;
}

console.log(reverse("hello"))


// -----------------------------------------------------------------
// Manual way using two pointers (common follow-up: "do it without
// built-in reverse()")
// -----------------------------------------------------------------
function reverseStringTwoPointers(str) {
  const chars = str.split("");
  let left = 0;
  let right = chars.length - 1;

  while (left < right) {
    // Swap characters at left and right, move pointers toward the middle.
    [chars[left], chars[right]] = [chars[right], chars[left]];
    left++;
    right--;
  }

  return chars.join("");
}

console.log(reverseStringTwoPointers("world")); // "dlrow"

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(n) - strings are immutable in JS, so we always
  need a new array/string to build the result.
*/

