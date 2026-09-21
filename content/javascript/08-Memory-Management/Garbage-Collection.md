# Garbage Collection

JS automatically frees memory that's no longer reachable. The main algorithm used by modern engines (like V8) is **Mark-and-Sweep**:

1. Starting from "roots" (global object, currently executing functions' variables), the GC marks everything reachable.
2. Anything not marked (unreachable) is considered garbage and swept (freed).

```js
let obj = { data: "large data" };
obj = null; // no more references to the original object -> eligible for GC
```

Older engines used **reference counting** (collect when refcount hits 0), but that fails on circular references:

```js
function circular() {
  const a = {};
  const b = {};
  a.ref = b;
  b.ref = a; // circular reference
} // reference counting would leak this; mark-and-sweep handles it fine
```
