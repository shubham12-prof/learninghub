# Generators

Functions that can pause and resume execution, producing a sequence of values lazily. Declared with `function*`, paused/resumed with `yield`.

```js
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++;
  }
}
const gen = idGenerator();
gen.next().value; // 1
gen.next().value; // 2
gen.next().value; // 3 — infinite, but only computes on demand

// Generators are iterable
function* range(start, end) {
  for (let i = start; i <= end; i++) yield i;
}
[...range(1, 5)]; // [1,2,3,4,5]

// Passing values back in
function* echo() {
  const x = yield "first";
  console.log("received:", x);
}
const e = echo();
e.next(); // {value:'first', done:false}
e.next("hello"); // logs "received: hello"
```

**Use case:** implementing custom iterables, lazy sequences, and (historically) async flow control before async/await existed.
