/*
  Top 30 - #10: Valid Parentheses

  PROBLEM: check if a string of brackets like "()[]{}" is properly
  matched and nested.
  Example: "()" -> true, "([)]" -> false, "{[]}" -> true

  WHY A STACK FITS: the LAST opened bracket must be the FIRST one
  closed (Last In, First Out) - exactly what a stack gives us.
*/

function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== pairs[char]) {
        return false; // mismatch, or nothing left to pop
      }
    }
  }

  return stack.length === 0; // everything got matched and closed
}

console.log(isValid("()[]{}")); // true
console.log(isValid("([)]"));   // false
console.log(isValid("{[]}"));   // true

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(n) worst case (all opening brackets, no closing)
*/
