# Call Stack

A LIFO (Last In, First Out) structure that tracks execution contexts.

```js
function a() {
  b();
}
function b() {
  c();
}
function c() {
  console.log("deepest");
}
a();

// Call Stack progression:
// [main]
// [main, a]
// [main, a, b]
// [main, a, b, c]  <- runs, logs "deepest"
// [main, a, b]      <- c() popped
// [main, a]          <- b() popped
// [main]              <- a() popped
```

**Stack overflow** happens when the stack grows beyond its limit — classic cause: uncontrolled recursion without a base case.

```js
function recurse() {
  return recurse();
}
recurse(); // Uncaught RangeError: Maximum call stack size exceeded
```
