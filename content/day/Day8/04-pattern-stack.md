# 04 - Pattern 3: Stack (Valid Parentheses and Daily Temperatures)

> **Time to learn:** ~70 min | **Level:** Coding | **Interview frequency:** High
> Tests: **21 passing**, including random comparison with brute force and a 100,000-item speed test. A version that only _counts_ brackets fails the `(]` and `([)]` tests.

## 1. The one idea

A **stack** is last-in, first-out. Use it whenever **the most recent unfinished thing must be dealt with first**: a bracket waiting to be closed, a day waiting for a warmer day, a number waiting for its operator. In JavaScript an array is a stack: `push` adds, `pop` removes the last, both O(1).

## 2. Analogy

A pile of plates. You can only add or take the **top** plate. A nested structure (a bracket inside a bracket) works the same way: the innermost opening bracket must be closed first.

## 3. Two shapes of the pattern

| Shape               | Stack holds                                                                  | You pop when...                            | Example                                  |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| **Matching**        | open items                                                                   | a closing item arrives                     | valid parentheses, HTML tags             |
| **Monotonic stack** | indices whose answer isn't known yet, kept in increasing or decreasing order | the new value **resolves** the top item(s) | next greater element, daily temperatures |
| **Evaluation**      | operands                                                                     | an operator arrives                        | reverse Polish notation                  |

## 4. Problem 1: Valid Parentheses

A string contains `()[]{}` (and maybe other characters). Return `true` if every opening bracket is closed by the **same type**, in the **right order**.

```
"()[]{}" -> true     "(]" -> false     "([)]" -> false     "{[]}" -> true     "(" -> false     "" -> true
```

Idea: push each opener; for each closer, pop and check it matches. At the end the stack must be **empty**. A closer with an empty stack: `pop()` returns `undefined`, which never matches, so it returns `false` automatically.

## 5. Problem 2: Daily Temperatures

`temps[i]` is the temperature on day `i`. For each day, how many days until a **warmer** one? `0` if there is none.

```
[73, 74, 75, 71, 69, 72, 76, 73]  ->  [1, 1, 4, 2, 1, 1, 0, 0]
```

- **Brute force:** for each day scan forward: O(n^2).
- **Monotonic stack:** keep the **indices of days still waiting**. When today is warmer than the day on top of the stack, that day has found its answer (`i - j`): pop it and keep checking. Then push today. Each index is pushed once and popped at most once: **O(n)**.

## 6. Solutions

```js
// Pattern 3: stack (last in, first out). Use it when the most recent unfinished thing must be handled first.

const PAIRS = { ")": "(", "]": "[", "}": "{" };

/** Valid Parentheses. O(n) time, O(n) space. */
export function isValid(s) {
  const stack = [];
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
    else if (ch in PAIRS) {
      if (stack.pop() !== PAIRS[ch]) return false; // wrong type, or nothing to close (pop gives undefined)
    }
  }
  return stack.length === 0; // anything left open is invalid
}

/** Daily Temperatures: for each day, how many days until a warmer one (0 if never). Monotonic stack of INDICES. O(n). */
export function dailyTemperatures(temps) {
  const answer = new Array(temps.length).fill(0);
  const waiting = []; // indices of days still waiting for a warmer day (temps decreasing)
  for (let i = 0; i < temps.length; i++) {
    while (waiting.length && temps[i] > temps[waiting[waiting.length - 1]]) {
      const j = waiting.pop(); // day j just found its warmer day: i
      answer[j] = i - j;
    }
    waiting.push(i);
  }
  return answer;
}

/** Brute force for comparison: O(n^2). */
export function dailyTemperaturesBrute(temps) {
  return temps.map((t, i) => {
    for (let j = i + 1; j < temps.length; j++) if (temps[j] > t) return j - i;
    return 0;
  });
}

/** Variant: evaluate a Reverse Polish expression, e.g. ["2","1","+","3","*"] = (2 + 1) * 3 = 9. */
export function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (["+", "-", "*", "/"].includes(token)) {
      const b = stack.pop(); // note the ORDER: b is the right operand
      const a = stack.pop();
      stack.push(
        token === "+"
          ? a + b
          : token === "-"
            ? a - b
            : token === "*"
              ? a * b
              : Math.trunc(a / b),
      );
    } else stack.push(Number(token));
  }
  return stack.pop();
}
```

Walk through the temperatures: day 0 (73) waits. Day 1 (74) is warmer than 73, so day 0's answer is `1`; day 1 waits. Day 2 (75) resolves day 1 (answer 1); waits. Days 3 (71), 4 (69) are colder, they just wait: the stack is `[2, 3, 4]`. Day 5 (72) resolves day 4 (1) and day 3 (2), but not day 2 (75). Day 6 (76) resolves day 5 (1) and day 2 (4). Day 7 (73) waits; days 6 and 7 never find a warmer day, so they stay `0`.

## 7. Tests

```js
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  dailyTemperatures,
  dailyTemperaturesBrute,
  evalRPN,
  isValid,
} from "./stack.js";

describe("isValid", () => {
  const cases = [
    ["()", true],
    ["()[]{}", true],
    ["(]", false],
    ["([)]", false],
    ["{[]}", true],
    ["", true],
    ["(", false],
    ["]", false],
    ["((", false],
    ["a(b)c", true],
    [")(", false],
  ];
  for (const [input, expected] of cases)
    test(`${JSON.stringify(input)} -> ${expected}`, () =>
      assert.equal(isValid(input), expected));
});

describe("dailyTemperatures", () => {
  const cases = [
    [
      [73, 74, 75, 71, 69, 72, 76, 73],
      [1, 1, 4, 2, 1, 1, 0, 0],
    ],
    [
      [30, 40, 50, 60],
      [1, 1, 1, 0],
    ],
    [
      [30, 60, 90],
      [1, 1, 0],
    ],
    [[], []],
    [[5], [0]],
    [
      [5, 5, 5],
      [0, 0, 0],
    ],
    [
      [90, 80, 70],
      [0, 0, 0],
    ],
  ];
  for (const [input, expected] of cases)
    test(`${JSON.stringify(input)}`, () =>
      assert.deepEqual(dailyTemperatures(input), expected));

  test("agrees with brute force on random input", () => {
    for (let n = 0; n < 300; n++) {
      const t = Array.from(
        { length: Math.floor(Math.random() * 20) },
        () => 30 + Math.floor(Math.random() * 10),
      );
      assert.deepEqual(
        dailyTemperatures(t),
        dailyTemperaturesBrute(t),
        JSON.stringify(t),
      );
    }
  });
  test("100,000 falling temperatures is fast (needs O(n))", () => {
    const t = Array.from({ length: 100_000 }, (_, i) => 100_000 - i);
    const start = performance.now();
    dailyTemperatures(t);
    assert.ok(performance.now() - start < 100, "too slow: O(n^2)?");
  });
});

describe("evalRPN", () => {
  test("works, including operand order and truncating division", () => {
    assert.equal(evalRPN(["2", "1", "+", "3", "*"]), 9);
    assert.equal(evalRPN(["4", "13", "5", "/", "+"]), 6);
    assert.equal(evalRPN(["5", "2", "-"]), 3); // 5 - 2, not 2 - 5
    assert.equal(evalRPN(["7", "-2", "/"]), -3); // truncates toward zero
  });
});
```

## 8. Edge cases to mention

Empty string/array, a single element, an input that starts with a closer (`")("`), unmatched openers left over (`"(("`), other characters mixed in, equal temperatures (not warmer, so no pop: `[5, 5, 5]` is `[0, 0, 0]`), strictly decreasing temperatures (the stack never pops: the worst case for a brute force).

## 9. Common mistakes (checked)

| Mistake                                                             | What happens                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Valid parentheses by **counting** opens and closes                  | `"(]"` and `"([)]"` wrongly return `true`                                            |
| Forgetting `stack.length === 0` at the end                          | `"(("` wrongly returns `true`                                                        |
| Popping from an empty stack and using the result without thinking   | works in JS (`undefined`), but in other languages it throws: say that you handled it |
| Storing **values** instead of **indices** in the temperatures stack | you can't compute the distance `i - j`                                               |
| Using `>=` instead of `>` when comparing temperatures               | equal temperatures would count as "warmer"                                           |
| Brute force with a nested loop                                      | correct, but the 100,000-day test is too slow                                        |
| RPN: popping operands in the wrong order                            | `5 2 -` gives `-3` instead of `3`: the **first** pop is the **right** operand        |

## 10. The 30-second explanation

> "For valid parentheses I push every opening bracket on a stack. When a closing bracket comes, I pop and check that it's the matching type; if the stack is empty or it doesn't match, it's invalid. At the end the stack must be empty. It's O(n) time and O(n) space. The same idea, a monotonic stack of indices, solves 'next warmer day': I keep the days that are still waiting, and each new day pops every waiting day it beats. Each index is pushed and popped once, so it's O(n) instead of O(n^2)."

## 11. Predict the output

**Q1** `isValid("([)]")`
**Q2** `isValid("{[]}")`
**Q3** `dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])`
**Q4** `evalRPN(["5", "2", "-"])`
**Q5** Why is Daily Temperatures O(n) even though there is a `while` inside the `for`?

## 12. Answers

- **Q1:** **false** (the `)` meets `[` on top of the stack).
- **Q2:** **true**.
- **Q3:** **`[1, 1, 4, 2, 1, 1, 0, 0]`**.
- **Q4:** **3** (`5 - 2`).
- **Q5:** Each index is **pushed once and popped at most once**, so the inner `while` runs at most `n` times **in total**, not per iteration: about `2n` operations.

## 13. Practice variations

| Problem                            | Hint                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| Min stack (`getMin` in O(1))       | keep a second stack of running minimums                      |
| Next greater element               | the same monotonic stack                                     |
| Evaluate Reverse Polish Notation   | above                                                        |
| Decode string `3[a2[c]]`           | stack of counts and partial strings                          |
| Largest rectangle in a histogram   | monotonic stack of increasing heights                        |
| Implement a queue using two stacks | move items between the stacks when the output stack is empty |

## Recap

- **Stack = last in, first out**; an array with `push`/`pop`.
- **Matching** (brackets), **monotonic** (next greater), **evaluation** (RPN).
- Monotonic stack: store **indices**, pop when the new value resolves the top: **O(n)** because each index moves in and out once.

## Checklist

- [ ] I can explain why `(]` and `([)]` need a stack, not a counter
- [ ] I can explain the monotonic stack and why it is O(n)
- [ ] I solved both problems from memory and my tests pass
- [ ] I got Q1 to Q5 right without looking
