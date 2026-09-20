# Traversal

Traversal means visiting every element of an array. JS gives you several ways to do it.

```javascript
const arr = [10, 20, 30, 40, 50];

// Classic for loop — gives you full control (index, break/continue)
for (let i = 0; i < arr.length; i++) {
  console.log(i, arr[i]);
}

// for...of — cleanest when you only need values
for (const val of arr) {
  console.log(val);
}

// forEach — functional style, but you can't break out of it
arr.forEach((val, idx) => console.log(idx, val));

// map — traversal + transformation, returns a new array
const doubled = arr.map((val) => val * 2);
```

## When to use what

- Need to `break`/`return` early → classic `for` loop
- Just reading values → `for...of`
- Side effects (logging, pushing to another structure) → `forEach`
- Need a transformed array → `map`

## Complexity

O(n) for a full traversal — always.
