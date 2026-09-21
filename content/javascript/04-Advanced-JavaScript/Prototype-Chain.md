# Prototype Chain

The chain of `[[Prototype]]` links an object walks up through when looking up a property.

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

const p1 = new Person("Alice");

// The chain: p1 -> Person.prototype -> Object.prototype -> null
```

**Lookup algorithm:** JS checks the object itself first, then walks up the prototype chain (`__proto__` → `__proto__` → ...) until it finds the property or hits `null` (the end of the chain, `Object.prototype`'s prototype).

```js
p1.toString(); // works — found way up the chain, on Object.prototype
Object.getPrototypeOf(p1) === Person.prototype; // true
Object.getPrototypeOf(Person.prototype) === Object.prototype; // true
Object.getPrototypeOf(Object.prototype); // null
```
