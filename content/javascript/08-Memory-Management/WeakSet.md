# WeakSet

Like a `Set`, but only stores **objects** (not primitives), held weakly. Not iterable, no `.size`.

```js
const visited = new WeakSet();
let el = document.querySelector(".card");
visited.add(el);
visited.has(el); // true

el = null; // element can now be GC'd, and automatically removed from the WeakSet
```

**Use case:** tracking whether an object has already been "processed" without preventing GC.
