# `this`

## Explanation
`this` refers to "who called the function" — its value depends on *how* a function is invoked, not where it's defined (with the exception of arrow functions). The rules:

1. **Plain function call** — `this` is `undefined` in strict mode (or the global object in non-strict mode).
2. **Method call** (`obj.method()`) — `this` is the object before the dot (`obj`).
3. **Constructor call** (`new Foo()`) — `this` is the newly created object.
4. **Arrow functions** — don't have their own `this`. They inherit `this` from the enclosing (lexical) scope.
5. **Explicit binding** — `call`, `apply`, `bind` let you set `this` manually.

## Examples
```js
const person = {
  name: "Alex",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
};
person.greet(); // "Hi, I'm Alex" — this = person

const greetFn = person.greet;
greetFn(); // "Hi, I'm undefined" — this lost its context!

const personArrow = {
  name: "Sam",
  greet: () => {
    console.log(`Hi, I'm ${this.name}`); // arrow function: this is NOT personArrow
  }
};
personArrow.greet(); // "Hi, I'm undefined"
```

### Classic gotcha with callbacks
```js
class Timer {
  constructor() { this.seconds = 0; }
  start() {
    setInterval(function () {
      this.seconds++; // 'this' here is NOT the Timer instance!
    }, 1000);
  }
}
```
Fix with an arrow function, which inherits `this` from `start()`:
```js
setInterval(() => { this.seconds++; }, 1000); // works correctly
```

## Why it matters
`this` confusion is one of the most common sources of JS bugs, especially with callbacks and event handlers. Understanding call-site rules (and when to use arrow functions) fixes most of these issues.

## Questions
1. What determines the value of `this` in a regular function — where it's defined or how it's called?
2. Why do arrow functions not have their own `this`?
3. What does `this` equal when you call a method on an object versus when you store that method in a variable and call it separately?
4. Predict the output:
```js
const obj = {
  value: 42,
  getValue: function() { return this.value; }
};
const fn = obj.getValue;
console.log(fn());
```
5. When would you deliberately use `call`, `apply`, or `bind` to control `this`?
