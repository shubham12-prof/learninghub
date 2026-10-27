# 01 - How to Solve Any Coding Problem (the Framework + Big-O + Pattern Signals)

> **Time to learn:** ~50 min | **Level:** Core skill | **Interview frequency:** Every coding round
> Read this first: files `02` to `06` each apply it to one pattern. Every output and claim below was run in Node 22.

## 1. The one idea

Interviewers don't mainly test whether you remember a solution. They watch **how you think**: do you clarify, start simple, improve step by step, test, and explain? A candidate who reaches a good solution this way beats one who silently writes a perfect answer.

## 2. Analogy

Building a house: you don't start laying bricks. You ask what the owner needs (**clarify**), sketch a rough version (**brute force**), find the weak spot (**bottleneck**), improve it (**optimise**), build (**code**), and inspect (**test**).

## 3. The 7 steps (do them in this order, aloud)

| #   | Step                                         | What you do                                                  | Say something like                                                                        |
| --- | -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | **Clarify**                                  | inputs, outputs, constraints, edge cases                     | "Can the array be empty? Are there duplicates? Is it sorted? How big can `n` be?"         |
| 2   | **Examples**                                 | work 1 normal and 1 edge example by hand                     | "For `abcabcbb` the answer is 3 because `abc`..."                                         |
| 3   | **Brute force**                              | the simplest correct approach, with its complexity           | "The obvious way is to check every pair: O(n^2). It's correct, but slow for large input." |
| 4   | **Find the bottleneck, then pick a pattern** | what work repeats? what could a lookup/sort/pointer replace? | "I'm re-scanning the same elements. A hash set gives O(1) lookups, so..."                 |
| 5   | **Code**                                     | small named steps; no cleverness                             | narrate each block                                                                        |
| 6   | **Test**                                     | run your examples **by hand**, then the edge cases           | "Let me trace `[1]`, then an empty array..."                                              |
| 7   | **Complexity**                               | time and space, and one possible improvement                 | "O(n) time, O(n) space for the set. If memory mattered, I'd sort first."                  |

If you only remember one thing: **say the brute force first**. It proves you can solve it, and it shows the interviewer what you are improving.

## 4. Big-O cheat sheet

| Complexity | Name         | Example                                          | n = 100,000 means...           |
| ---------- | ------------ | ------------------------------------------------ | ------------------------------ |
| O(1)       | constant     | array index, `Map.get`, `Set.has` (average)      | instant                        |
| O(log n)   | logarithmic  | binary search                                    | about 17 steps                 |
| O(n)       | linear       | one loop, `includes`, `indexOf`, `filter`, `map` | 100,000 steps                  |
| O(n log n) | linearithmic | `sort`                                           | about 1.7 million steps        |
| O(n^2)     | quadratic    | nested loops over the same array                 | **10 billion steps: too slow** |
| O(2^n)     | exponential  | all subsets, naive recursive Fibonacci           | only for n up to about 20      |
| O(n!)      | factorial    | all permutations                                 | only for n up to about 10      |

**Rule of thumb for the constraints:** `n` up to ~100,000 needs O(n) or O(n log n); `n` up to ~1,000 allows O(n^2); `n` up to ~20 allows O(2^n); `n` up to ~10 allows O(n!). The size limit in the problem tells you which pattern is expected.

I measured one case: the naive recursive `fib(40)` took about **1.1 seconds** on this machine and grows about 1.6 times per step; the memoised version is instant.

**Space** counts the extra memory you allocate (a `Set` of `n` items is O(n)); the recursion stack counts too (recursion depth `d` is O(d) space).

**Hidden costs in JavaScript:** `arr.includes(x)` and `indexOf` are O(n), so calling them **inside a loop** makes it O(n^2) (use a `Set`). `[...arr]`, `slice` and `concat` copy: O(n). `str += ch` in a loop is fine in modern engines but building with an array and `join` is the safe habit. `sort()` is O(n log n).

## 5. Which pattern? Signals in the problem

| If you see...                                                                                                           | Think                                        | File       |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------- |
| "have I seen this before?", counting, pairs that add up, duplicates, "in O(n)" with unsorted input                      | **Hash map / set**                           | `02`       |
| a **sorted** array, a pair/triple, a palindrome, "in place", "maximise something between two ends"                      | **Two pointers**                             | `03`       |
| brackets, "most recent first", "next greater element", undo, nested structure, evaluating expressions                   | **Stack**                                    | `04`       |
| "all combinations/subsets/permutations", a problem that contains a smaller copy of itself, trees, repeated sub-problems | **Recursion / backtracking** (+ memoisation) | `05`       |
| a **sorted** array or a yes/no answer that flips once ("first bad version", minimise a maximum), `n` huge, "O(log n)"   | **Binary search**                            | `06`       |
| a contiguous subarray/substring with a condition                                                                        | **Sliding window** (Day 6)                   | Day 6 `05` |

## 6. JavaScript gotchas that bite in coding rounds (all verified)

```js
[10, 9, 1].sort()                    // [1, 10, 9]    default sort compares STRINGS
[10, 9, 1].sort((a, b) => a - b)     // [1, 9, 10]    numeric sort needs a comparator
Math.max(...new Array(200000).fill(1))   // RangeError    too many arguments: use a loop or reduce on huge arrays
Math.max()                           // -Infinity     (and Math.min() is Infinity) for no arguments
[] === []                            // false         objects/arrays compare by reference
[NaN].includes(NaN)                  // true          but [NaN].indexOf(NaN) is -1
const a = Array(3).fill([]);  a[0].push(1)   // [[1],[1],[1]]  the SAME inner array three times
const b = Array.from({ length: 3 }, () => []);  b[0].push(1)   // [[1],[],[]]  three separate arrays
"b" > "a"   // true     "B" > "a"   // false     "10" < "9"   // true    strings compare character by character
-1 % 3                               // -1            JS remainder keeps the sign: use ((x % n) + n) % n to get 2
Math.floor(-1.5)  // -2     Math.trunc(-1.5)  // -1    integer division toward zero needs trunc
0 || 5   // 5      0 ?? 5   // 0     `||` treats 0 as missing; `??` only null/undefined
```

## 7. What to say when stuck (practise these)

- "Let me work a small example by hand to see the pattern."
- "The brute force is O(n^2). Where is it repeating work?"
- "If the input were sorted, would that help? Could I sort it first, at O(n log n)?"
- "I'll write the simple version first and then optimise."
- "I think the issue is [X]. Let me test with `[]` and `[1]`."
- Ask for a hint **after you have tried**: "I'm considering a hash map but I'm unsure how to handle duplicates. Is that the right direction?"

## 8. A 45-minute round, minute by minute

| Minutes  | Do                                                                                      |
| -------- | --------------------------------------------------------------------------------------- |
| 0 to 5   | Read, restate, clarify, 1 to 2 examples                                                 |
| 5 to 10  | Brute force + complexity, then the idea for improvement (check it with the interviewer) |
| 10 to 30 | Code the optimal solution, narrating                                                    |
| 30 to 40 | Test: trace an example, then edge cases; fix bugs                                       |
| 40 to 45 | Complexity, trade-offs, follow-up ("what if it doesn't fit in memory?")                 |

## 9. Common mistakes

1. Coding in silence for 15 minutes.
2. Jumping to the optimal pattern without a brute force or an example.
3. Not asking about constraints and edge cases.
4. Never running your own examples. **Trace by hand before saying "done".**
5. Panicking at a bug: stay calm, narrate what you expect vs what you see.
6. Using `includes`/`indexOf` inside a loop and calling it O(n).
7. Forgetting the empty input, one element, duplicates, negatives, very large input.
8. Mutating the input when it wasn't allowed.
9. Not stating complexity.
10. Memorising solutions instead of **recognising the pattern**.

## 10. Predict the output

**Q1** What is `[1, 10, 2, 21].sort()`?

**Q2** An algorithm does a `for` loop over `n` items and, inside, calls `arr.includes(x)`. What is its complexity? What fixes it?

**Q3** Constraint: `n <= 100,000`. Is an O(n^2) solution acceptable? Which complexities are?

**Q4** `Math.max()` with no arguments returns what?

**Q5** `const grid = Array(2).fill([0, 0]); grid[0][0] = 1;` What is `grid`?

## 11. Answers

- **Q1:** `[1, 10, 2, 21]` sorted as strings: `[1, 10, 2, 21]` (`"1" < "10" < "2" < "21"`). Numeric: `.sort((a, b) => a - b)` gives `[1, 2, 10, 21]`.
- **Q2:** **O(n^2)**: `includes` is O(n) and runs `n` times. Put the items in a `Set` first, so each check is O(1): O(n) total.
- **Q3:** **No**: about 10^10 steps. You need O(n) or O(n log n) (or O(log n)).
- **Q4:** **`-Infinity`**.
- **Q5:** `[[1, 0], [1, 0]]`: both rows are the **same array**. Use `Array.from({ length: 2 }, () => [0, 0])`.

## Recap

- **Clarify, example, brute force, bottleneck, code, test, complexity**: aloud and in that order.
- The **constraint on `n`** tells you the target complexity.
- Recognise the **pattern** from the signals, then apply its template.
- Trace by hand and test edge cases **before** saying you're done.

## Checklist

- [ ] I can recite the 7 steps
- [ ] I can say the complexity of loops, `includes`, `Set.has`, `sort`, binary search
- [ ] I can map a problem statement to a pattern using the signals
- [ ] I know the JavaScript gotchas in section 6
- [ ] I got Q1 to Q5 right without looking
