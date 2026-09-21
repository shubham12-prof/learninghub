# Prototype

Every JS object has an internal link (`[[Prototype]]`, accessible via `__proto__` or `Object.getPrototypeOf`) to another object it inherits from. Functions have a `.prototype` property used to build that link for instances created with `new`.

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

const p1 = new Person("Alice");
p1.greet(); // "Hi, I'm Alice" — found on Person.prototype, not p1 itself

p1.hasOwnProperty("name"); // true
p1.hasOwnProperty("greet"); // false — inherited, not p1's own property
```
