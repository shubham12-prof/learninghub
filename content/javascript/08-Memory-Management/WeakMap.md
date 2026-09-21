# WeakMap

Like a `Map`, but keys **must be objects** and are held **weakly** — if there are no other references to a key object, it can be garbage collected, automatically removing the entry. Not iterable, no `.size`, no `.keys()`.

```js
let user = { name: "Alice" };
const wm = new WeakMap();
wm.set(user, "some metadata");

wm.get(user); // "some metadata"

user = null; // the object is now eligible for GC, AND its WeakMap entry is auto-removed
```

**Use case:** storing private/metadata associated with objects (e.g., DOM elements) without preventing them from being garbage collected.

```js
const privateData = new WeakMap();
class User {
  constructor(name) {
    privateData.set(this, { name }); // truly private, and cleans up if `this` is GC'd
  }
  getName() {
    return privateData.get(this).name;
  }
}
```
