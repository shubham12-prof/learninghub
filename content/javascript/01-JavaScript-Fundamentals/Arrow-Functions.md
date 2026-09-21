# Arrow Functions

```js
const add = (a, b) => a + b;

// No own `this`, `arguments`, or `super` — inherits from enclosing scope
const obj = {
  name: "Alice",
  greetArrow: () => console.log(this.name), // `this` is NOT obj — bug!
  greetNormal() {
    console.log(this.name); // `this` IS obj — correct
  },
};
```

**Interview favorite:** arrow functions can't be used as constructors (`new` throws) and don't have their own `this`, making them unsuitable for object methods that rely on `this`.
