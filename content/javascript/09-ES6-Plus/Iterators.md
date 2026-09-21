# Iterators

An object implementing the iterator protocol: a `next()` method returning `{ value, done }`.

```js
function makeIterator(arr) {
  let index = 0;
  return {
    next() {
      return index < arr.length
        ? { value: arr[index++], done: false }
        : { value: undefined, done: true };
    },
  };
}
const it = makeIterator(["a", "b"]);
it.next(); // {value:'a', done:false}
it.next(); // {value:'b', done:false}
it.next(); // {value:undefined, done:true}
```

Anything with a `[Symbol.iterator]` method is **iterable** and works with `for...of`, spread, and destructuring (arrays, strings, Maps, Sets are all iterable by default; plain objects are NOT).
