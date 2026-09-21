# `this` Keyword

`this` is determined by **how a function is called**, not where it's defined (except for arrow functions).

```js
const obj = {
  name: "Alice",
  greet() {
    console.log(this.name);
  },
};
obj.greet(); // "Alice" — this = obj (call-site is obj.greet())

const fn = obj.greet;
fn(); // undefined (or error in strict mode) — this = global/undefined, lost context

function normal() {
  console.log(this);
}
normal(); // window (non-strict) / undefined (strict)

const arrow = () => console.log(this);
arrow(); // `this` from the enclosing lexical scope, NOT the caller
```

`this` rules (in order of precedence): `new` binding > explicit binding (`call/apply/bind`) > implicit binding (`obj.method()`) > default binding (global/undefined).
