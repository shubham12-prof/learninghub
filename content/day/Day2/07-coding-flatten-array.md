# 07 - Coding: Flatten a Nested Array

> **Time to learn:** ~35 min | **Difficulty:** Easy to Medium | **Interview frequency:** Very high
> This is the other Day 2 coding option (the first is `06-coding-debounce.md`). Your daily target is **one** of them; do both if you have time.

## 1. The problem

Write `flatten(arr)` that turns a nested array into a single-level array, keeping the order.

```js
flatten([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]
flatten([]); // []
flatten([[], [[]]]); // []
flatten([1, [2, 3]]); // [1, 2, 3]
```

Common follow-up: **`flatten(arr, depth)`** which only flattens `depth` levels.

## 2. How to think about it

- Walk through every item. If the item is an **array**, flatten **it** too (that's **recursion**). Otherwise keep it.
- Detect arrays with **`Array.isArray(x)`** (not `typeof x === "object"`, because `null` and plain objects are objects too).
- The output has **n** items, where n = total number of non-array elements, so the best possible time is **O(n)**.

Ask the interviewer: _"Can I use `Array.prototype.flat`? How deep can the nesting be? Should I flatten a specific depth?"_

## 3. Solutions

### Solution 1: Built-in `flat`

```js
const flatten = (arr) => arr.flat(Infinity);
```

- `flat()` flattens **1 level** by default; `flat(Infinity)` flattens everything.
- `flat(depth)` is the depth-limited version.
- Time: **O(n)** | Space: **O(n)**
- Great in real code; in an interview they usually say "now without `flat`".

### Solution 2: Recursion with a loop (the standard answer)

```js
function flatten(arr) {
  const result = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item)); // flatten the inner array, then add its items
    } else {
      result.push(item);
    }
  }

  return result;
}
```

Trace for `[1, [2, [3]]]`:

```
flatten([1, [2, [3]]])
  1            -> push 1
  [2, [3]]     -> flatten([2, [3]])
                    2          -> push 2
                    [3]        -> flatten([3]) = [3]
                    -> [2, 3]
               -> push 2, 3
  -> [1, 2, 3]
```

- Time: **O(n)** (roughly; the repeated spreading copies items once per nesting level, so worst case is O(n \* depth)) | Space: **O(n + depth)** for the recursion

### Solution 2b: Recursion with an accumulator (avoids repeated copying)

```js
function flatten(arr, result = []) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      flatten(item, result); // push into the SAME array
    } else {
      result.push(item);
    }
  }
  return result;
}
```

- Time: **O(n)** | Space: **O(depth)** extra for the call stack. A bit more efficient and avoids `push(...hugeArray)` argument limits.

### Solution 3: `reduce` + `concat` (the functional one-liner)

```js
const flatten = (arr) =>
  arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flatten(item) : item),
    [],
  );
```

- Time: **O(n \* depth)** (each `concat` copies) | Space: **O(n)**
- Elegant, but less efficient than 2b.

### Solution 4: Iterative with a stack (no recursion)

```js
function flatten(arr) {
  const stack = [...arr]; // copy so we don't mutate the input
  const result = [];

  while (stack.length) {
    const item = stack.pop(); // take from the END
    if (Array.isArray(item)) {
      stack.push(...item); // put the inner items back on the stack
    } else {
      result.push(item);
    }
  }

  return result.reverse(); // we popped from the end, so reverse at the end
}
```

- Time: **O(n)** | Space: **O(n)**
- **Never overflows the call stack**, however deeply nested. This is the answer to "what if the array is 100,000 levels deep?".

### Solution 5: Generator (lazy, memory friendly)

```js
function* flattenGen(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) yield* flattenGen(item);
    else yield item;
  }
}

console.log([...flattenGen([1, [2, [3]]])]); // [1, 2, 3]
```

Useful when you want to process items one at a time without building the whole result.

### Solution 6: Depth-limited flatten (the common follow-up)

```js
function flattenDepth(arr, depth = 1) {
  const result = [];

  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flattenDepth(item, depth - 1));
    } else {
      result.push(item);
    }
  }

  return result;
}

flattenDepth([1, [2, [3, [4]]]], 1); // [1, 2, [3, [4]]]
flattenDepth([1, [2, [3, [4]]]], 2); // [1, 2, 3, [4]]
```

This behaves like `arr.flat(depth)`.

### A hack you should know but not use

```js
JSON.parse("[" + JSON.stringify([1, [2, [3]]]).replace(/\[|\]/g, "") + "]"); // [1, 2, 3]
```

It breaks if any string contains `[`, `]`, or if there are `undefined`s/functions/objects. Mention it only to show you know why it's fragile.

## 4. Edge cases to mention

| Input                    | Expected                                            | Notes                                           |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------- |
| `[]`                     | `[]`                                                | Empty                                           |
| `[[], [[]]]`             | `[]`                                                | Only empty arrays                               |
| `[1, null, [undefined]]` | `[1, null, undefined]`                              | `null` / `undefined` are values, **not** arrays |
| `[1, {a: [2]}]`          | `[1, {a: [2]}]`                                     | Objects are **not** flattened (only arrays are) |
| `["ab", ["cd"]]`         | `["ab", "cd"]`                                      | Strings are **not** split into characters       |
| Sparse array `[1, , 3]`  | `flat()` removes holes; `for...of` sees `undefined` | Use `forEach` (skips holes) to match `flat`     |
| Very deep nesting        | Recursion can throw `RangeError`                    | Use the iterative version                       |
| Don't mutate the input   | Always build a new array                            | `arr.pop()` on the original would destroy it    |

Sparse-array demo:

```js
const sparse = [1, , 3];
sparse.flat(); // [1, 3]            holes are removed
[...sparse]; // [1, undefined, 3] spread / for...of turn holes into undefined
```

## 5. Bonus: flatten an **object**

A very common sibling question: turn `{ a: { b: 1, c: { d: 2 } } }` into `{ "a.b": 1, "a.c.d": 2 }`.

```js
function flattenObject(obj, prefix = "", result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flattenObject(value, path, result);
    } else {
      result[path] = value;
    }
  }
  return result;
}

flattenObject({ a: { b: 1, c: { d: 2 } }, e: 3 });
// { 'a.b': 1, 'a.c.d': 2, e: 3 }
```

## 6. Which one should I use in an interview?

1. Mention `arr.flat(Infinity)` first (shows you know the language).
2. Write **Solution 2** (recursion) and explain the base case: "an item that isn't an array is added as is".
3. If asked about depth limits or huge nesting, show **Solution 4** (iterative).
4. If asked for "flatten up to depth n", show **Solution 6**.
5. State the complexity: **O(n)** time for the best versions.

## 7. Practice variations

1. `flatten(arr, depth)` **without recursion**.
2. Flatten and **remove duplicates** at the same time.
3. Flatten an array of **arrays of objects** and collect a field (e.g. all `id`s).
4. Return the **maximum nesting depth** of an array.
5. **Unflatten**: chunk a flat array into groups of size n.
6. Implement your own **`Array.prototype.myFlat(depth)`**.

### Hints / answers

```js
// 1. Depth-limited, iterative: keep [item, depth] pairs on the stack
function flattenDepthIter(arr, depth = 1) {
  const stack = arr.map((item) => [item, depth]);
  const result = [];

  while (stack.length) {
    const [item, d] = stack.pop();
    if (Array.isArray(item) && d > 0) {
      for (const inner of item) stack.push([inner, d - 1]);
    } else {
      result.push(item);
    }
  }
  return result.reverse();
}

// 2. Flatten + unique
const flatUnique = (arr) => [...new Set(arr.flat(Infinity))];

// 3. Collect ids from nested arrays of objects
const collectIds = (arr) => arr.flat(Infinity).map((o) => o.id);

// 4. Maximum depth
function maxDepth(arr) {
  let max = 1;
  for (const item of arr) {
    if (Array.isArray(item)) max = Math.max(max, 1 + maxDepth(item));
  }
  return max;
}
maxDepth([1, [2, [3]]]); // 3
maxDepth([]); // 1

// 5. Chunk
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// 6. Polyfill
Array.prototype.myFlat = function (depth = 1) {
  const result = [];
  this.forEach((item) => {
    // forEach skips holes, like the real flat
    if (Array.isArray(item) && depth > 0) {
      result.push(...item.myFlat(depth - 1));
    } else {
      result.push(item);
    }
  });
  return result;
};

[1, [2, [3]]].myFlat(1); // [1, 2, [3]]
```

## Recap

- Flatten = walk the array; **if an item is an array, flatten it too** (recursion), otherwise keep it.
- Use `Array.isArray`. Don't flatten objects or split strings.
- Built-in: `arr.flat(Infinity)`; depth-limited: `arr.flat(n)`.
- Recursive is the classic answer; the **stack** version avoids call-stack overflow.
- Pass an accumulator (`result`) to avoid repeated array copying.
- Never mutate the input array.

## Checklist

- [ ] I can write the recursive version from memory
- [ ] I can write the iterative (stack) version
- [ ] I can add a `depth` parameter
- [ ] I can explain the edge cases (`null`, objects, strings, empty arrays)
- [ ] I solved at least 3 practice variations
