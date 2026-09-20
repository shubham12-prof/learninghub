# Parentheses

Stack-based problems involving matching, validating, or generating balanced brackets `()`, `{}`, `[]`.

## Valid Parentheses — is the string balanced?

```javascript
function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };

  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else {
      // closing bracket: top of stack must match
      if (stack.pop() !== pairs[ch]) return false;
    }
  }

  return stack.length === 0; // nothing left unmatched
}

console.log(isValid("()[]{}")); // true
console.log(isValid("(]")); // false
console.log(isValid("([)]")); // false
console.log(isValid("{[]}")); // true
```

## Generate Valid Parentheses — all combinations of n pairs

```javascript
function generateParenthesis(n) {
  const result = [];

  function backtrack(current, open, close) {
    if (current.length === n * 2) {
      result.push(current);
      return;
    }
    if (open < n) backtrack(current + "(", open + 1, close);
    if (close < open) backtrack(current + ")", open, close + 1);
  }

  backtrack("", 0, 0);
  return result;
}

console.log(generateParenthesis(3));
// ["((()))","(()())","(())()","()(())","()()()"]
```

## Minimum Removals to Make Valid

```javascript
function minRemoveToMakeValid(s) {
  const chars = s.split("");
  const stack = [];

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") {
      stack.push(i);
    } else if (chars[i] === ")") {
      if (stack.length > 0) stack.pop();
      else chars[i] = ""; // unmatched closing bracket, remove it
    }
  }

  // any unmatched opening brackets left on the stack also get removed
  for (const i of stack) chars[i] = "";

  return chars.join("");
}
```

## Complexity

Validation: O(n) time, O(n) space.
Generation: O(4^n / sqrt(n)) time (Catalan number growth) — exponential but tightly bounded by backtracking constraints.

## Recognize this pattern when...

The problem involves nested/matching structures — brackets, tags, or any "opens then must close" relationship.
