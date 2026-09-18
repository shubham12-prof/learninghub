# map / filter / reduce

## Explanation
These are the three most important array methods in JavaScript. They're all higher-order functions that take a callback and return new data without mutating the original array (this is important for predictable code).

- **`map`** — transforms each element, returns a new array of the *same length*.
- **`filter`** — tests each element, returns a new array with only elements that *pass the test*.
- **`reduce`** — combines all elements into a *single value* (a sum, an object, another array — anything).

## Examples
```js
const nums = [1, 2, 3, 4, 5];

// map: double every number
const doubled = nums.map(n => n * 2);
// [2, 4, 6, 8, 10]

// filter: keep only even numbers
const evens = nums.filter(n => n % 2 === 0);
// [2, 4]

// reduce: sum all numbers
const total = nums.reduce((acc, curr) => acc + curr, 0);
// 15 (acc = accumulator, starts at 0)

// reduce building an object
const people = [{ name: "A", age: 25 }, { name: "B", age: 30 }];
const ageByName = people.reduce((acc, person) => {
  acc[person.name] = person.age;
  return acc;
}, {});
// { A: 25, B: 30 }

// Chaining them together
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n * 10);
// [20, 40]
```

## Why it matters
These methods replace manual `for` loops with clean, declarative, chainable code. They're used constantly in real-world JS — transforming API data, building UI lists, aggregating stats. Interviewers ask about these often too.

## Questions
1. What's the core difference between what `map` and `filter` return?
2. Why does `reduce` need an initial value (the second argument)? What happens if you skip it?
3. Rewrite this loop using `map`:
```js
let squares = [];
for (let n of [1, 2, 3]) { squares.push(n * n); }
```
4. Use `filter` and `reduce` together to find the sum of all numbers greater than 10 in `[5, 12, 8, 20, 3]`.
5. Why do `map`/`filter`/`reduce` not mutate the original array, and why is that considered a good practice?
