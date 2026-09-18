# Shallow Copy vs Deep Copy

## Explanation
When copying objects/arrays in JS, it matters *how deep* the copy goes:

- **Shallow copy** — copies the top-level properties only. If a property holds a nested object/array, the *reference* to that nested object is copied, not the object itself — so both copies still point to the same nested object.
- **Deep copy** — copies everything, including nested objects/arrays, recursively, so the copy is completely independent of the original.

Methods like spread (`...`), `Object.assign()`, and `Array.slice()` only do **shallow** copies.

## Examples

### Shallow copy problem
```js
const original = { name: "Kai", address: { city: "Delhi" } };
const copy = { ...original }; // shallow copy

copy.name = "Sam";           // fine, doesn't affect original
copy.address.city = "Mumbai"; // uh oh — nested object is SHARED

console.log(original.address.city); // "Mumbai" — original got changed too!
```

### Deep copy solutions
```js
// Method 1: structuredClone (modern, built-in, recommended)
const deepCopy = structuredClone(original);

// Method 2: JSON trick (works for simple data, breaks on functions/dates/undefined)
const deepCopy2 = JSON.parse(JSON.stringify(original));

deepCopy.address.city = "Chennai";
console.log(original.address.city); // unaffected, still "Delhi" (or whatever it was)
```

## Why it matters
This is one of the most common sources of "mystery bugs" in JS apps — especially in React, where accidentally mutating shared nested state can cause components to not re-render correctly, or unrelated parts of an app to silently change data.

## Questions
1. What's the core difference between a shallow copy and a deep copy?
2. Why does `{ ...original }` fail to fully protect nested objects from mutation?
3. What's a modern built-in way to make a true deep copy?
4. What's a limitation of the `JSON.parse(JSON.stringify(obj))` deep copy trick?
5. Predict the output:
```js
const a = { list: [1, 2, 3] };
const b = { ...a };
b.list.push(4);
console.log(a.list);
```
