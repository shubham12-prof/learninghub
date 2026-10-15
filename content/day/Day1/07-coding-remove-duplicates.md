# 07 - Coding: Remove Duplicates

> **Time to learn:** ~30 min | **Difficulty:** Easy | **Interview frequency:** Very high

## 1. The problem

Write a function `removeDuplicates(arr)` that returns a new array with duplicate values removed, **keeping the first occurrence** and the original order.

```js
removeDuplicates([1, 2, 2, 3, 4, 4, 5]); // [1, 2, 3, 4, 5]
removeDuplicates(["a", "b", "a", "c", "b"]); // ["a", "b", "c"]
removeDuplicates([]); // []
```

The same question is often asked for **strings**: `"programming"` -> `"progamin"`.

## 2. How to think about it

You need a fast way to answer _"have I seen this value before?"_

- Slow way: look through the result array each time -> O(n) per check -> O(n^2) total.
- Fast way: keep a **Set** (or object) of seen values -> O(1) per check -> O(n) total.

Always ask: _"Should I mutate the original array? Is order important? Are the items primitives or objects?"_

## 3. Solutions

### Solution 1: `Set` (best for most cases)

```js
function removeDuplicates(arr) {
  return [...new Set(arr)];
}
```

- A `Set` only stores unique values and remembers insertion order.
- Time: **O(n)** | Space: **O(n)**
- Alternative syntax: `Array.from(new Set(arr))`

### Solution 2: `filter` + `indexOf`

```js
function removeDuplicates(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}
```

An item is kept only if its **first** position equals the current position.

- Time: **O(n^2)** (`indexOf` scans the array each time) | Space: **O(n)**
- Pros: no extra data structure. Cons: slow for big arrays.

### Solution 3: `for` loop + `includes`

```js
function removeDuplicates(arr) {
  const result = [];
  for (const item of arr) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
```

- Time: **O(n^2)** | Space: **O(n)**
- The easiest to explain step by step.

### Solution 4: Loop + object / Map as a "seen" lookup (O(n), no `Set`)

```js
function removeDuplicates(arr) {
  const seen = {};
  const result = [];

  for (const item of arr) {
    if (!seen[item]) {
      seen[item] = true;
      result.push(item);
    }
  }
  return result;
}
```

- Time: **O(n)** | Space: **O(n)**
- **Warning:** object keys are always strings, so `1` and `"1"` collide. Use `Map` or `Set` when you need to tell them apart:

```js
function removeDuplicates(arr) {
  const seen = new Map();
  const result = [];
  for (const item of arr) {
    if (!seen.has(item)) {
      seen.set(item, true);
      result.push(item);
    }
  }
  return result;
}
```

### Solution 5: `reduce`

```js
function removeDuplicates(arr) {
  return arr.reduce((acc, item) => {
    if (!acc.includes(item)) acc.push(item);
    return acc;
  }, []);
}
```

- Time: **O(n^2)** | Space: **O(n)**

### Solution 6: Sort first, then compare neighbours

```js
function removeDuplicatesSorted(arr) {
  const sorted = [...arr].sort((a, b) => a - b); // numbers only
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] !== sorted[i - 1]) {
      result.push(sorted[i]);
    }
  }
  return result;
}
```

- Time: **O(n log n)** | Space: **O(n)**
- **Does not keep the original order.** Useful if the array is already sorted: then you can do it in O(n) and even in O(1) extra space.

### Bonus: in-place for a sorted array (two pointers)

```js
function removeDuplicatesInPlace(nums) {
  if (nums.length === 0) return 0;

  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1; // new length; first `slow + 1` items are unique
}

const nums = [1, 1, 2, 2, 3];
const len = removeDuplicatesInPlace(nums);
console.log(nums.slice(0, len)); // [1, 2, 3]
```

- Time: **O(n)** | Space: **O(1)**

## 4. Removing duplicate characters from a string

```js
function removeDuplicateChars(str) {
  return [...new Set(str)].join("");
}

removeDuplicateChars("programming"); // "progamin"
```

Case-insensitive version (keep the first form seen):

```js
function removeDuplicateCharsCI(str) {
  const seen = new Set();
  let result = "";
  for (const ch of str) {
    const key = ch.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result += ch;
    }
  }
  return result;
}

removeDuplicateCharsCI("Hello"); // "Helo"
```

## 5. Arrays of objects

`Set` compares objects by **reference**, so two objects with the same content are _not_ equal:

```js
const users = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ravi" },
  { id: 1, name: "Asha" },
];

[...new Set(users)].length; // 3 -> nothing removed
```

Remove duplicates by a **key**:

```js
function uniqueBy(arr, key) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}

uniqueBy(users, "id");
// [{ id: 1, name: "Asha" }, { id: 2, name: "Ravi" }]
```

Using `Map` to **keep the last** occurrence instead:

```js
const lastWins = [...new Map(users.map((u) => [u.id, u])).values()];
```

## 6. Edge cases to mention

| Input                     | Expected            | Notes                                                                                     |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `[]`                      | `[]`                | Empty                                                                                     |
| `[1]`                     | `[1]`               | Single item                                                                               |
| `[1, "1"]`                | `[1, "1"]`          | Different types are different values (`Set` handles this correctly)                       |
| `[NaN, NaN]`              | `[NaN]`             | `Set` treats `NaN` as equal to itself (but `indexOf` does **not**: it returns -1 for NaN) |
| `[0, -0]`                 | `[0]`               | `Set` treats `0` and `-0` as the same                                                     |
| `[null, undefined, null]` | `[null, undefined]` | Works with `Set`                                                                          |
| Objects                   | see section 5       | Compare by key                                                                            |

## 7. Which one should I use in an interview?

1. Start with `[...new Set(arr)]` and explain **why** it is O(n).
2. If asked for "without Set", show the `Map`/object lookup version (O(n)).
3. Show `filter + indexOf` and say it is O(n^2), which shows you understand trade-offs.
4. Mention objects need a key, and `NaN` quirks if you want to impress.

## 8. Practice variations

1. Remove duplicates but keep the **last** occurrence.
2. Return only the elements that appear **exactly once**.
3. Return only the elements that are **duplicated** (appear more than once).
4. Find the **first repeated** element in an array.
5. Find the **intersection** and **union** of two arrays (without duplicates).

### Hints / answers

```js
// 1. Keep last occurrence
const keepLast = (arr) => arr.filter((item, i) => arr.lastIndexOf(item) === i);

// 2. Appear exactly once
const onlyUnique = (arr) =>
  arr.filter((item) => arr.indexOf(item) === arr.lastIndexOf(item));

// 3. Duplicated values (listed once)
const duplicates = (arr) => [
  ...new Set(arr.filter((item, i) => arr.indexOf(item) !== i)),
];

// 4. First repeated element
function firstRepeated(arr) {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return item;
    seen.add(item);
  }
  return undefined;
}

// 5. Intersection and union
const intersection = (a, b) => [...new Set(a)].filter((x) => new Set(b).has(x));
const union = (a, b) => [...new Set([...a, ...b])];
```

## Recap

- Best answer: `[...new Set(arr)]` -> O(n) time, keeps order, handles `NaN`.
- `filter + indexOf` and `includes` loops are O(n^2) but easy to explain.
- Object keys become strings, so use `Map`/`Set` when types matter.
- For objects, dedupe by a key (`id`).
- Sorted input can be deduplicated in place with two pointers in O(1) space.

## Checklist

- [ ] I can write the `Set` solution and explain its complexity
- [ ] I can write a solution without `Set`
- [ ] I can dedupe an array of objects by `id`
- [ ] I solved all 5 practice variations
