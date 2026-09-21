# Object Methods

```js
const obj = { a: 1, b: 2, c: 3 };

Object.keys(obj); // ["a","b","c"]
Object.values(obj); // [1,2,3]
Object.entries(obj); // [["a",1],["b",2],["c",3]]
Object.assign({}, obj, { d: 4 }); // merges into a new object -> {a,b,c,d}
Object.freeze(obj); // makes object immutable (shallow)
Object.isFrozen(obj); // true
Object.seal(obj); // prevents add/remove of props, allows edits
Object.fromEntries([["a", 1]]); // {a:1} — reverse of entries

// Iterate with entries()
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
```
