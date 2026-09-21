# Symbols

A primitive type representing a guaranteed-**unique** value — useful for creating non-colliding object keys.

```js
const id1 = Symbol("id");
const id2 = Symbol("id");
id1 === id2; // false — always unique, even with the same description

const user = {
  name: "Alice",
  [id1]: 12345, // symbol as a key — avoids clashing with string keys
};

// Symbols are NOT enumerated by for...in, Object.keys, or JSON.stringify
Object.keys(user); // ["name"] — id1 is hidden
Object.getOwnPropertySymbols(user); // [Symbol(id)]

// Well-known symbols customize built-in behavior
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  }
}
[...new Range(1, 5)]; // [1,2,3,4,5]
```
