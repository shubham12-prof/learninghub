# Quick Interview Q&A

**Q: What is a closure and give a real use case?**
A function bundled with its lexical environment. Real uses: data privacy/encapsulation, memoization, currying, event handler factories.

**Q: Why doesn't an arrow function have its own `this`?**
It doesn't create its own execution context for `this` — it captures `this` lexically from its enclosing scope at definition time.

**Q: Difference between `Function.prototype` and `__proto__`?**
`prototype` is a property on constructor functions used to build the prototype chain for instances created with `new`. `__proto__` is the actual link on an instance pointing to its constructor's prototype.

**Q: Are JS classes purely syntactic sugar?**
Mostly — they compile down to prototype-based inheritance under the hood, though private fields (`#`) and some class semantics (like the TDZ before `super()` in constructors) offer real behavioral differences from pre-ES6 patterns.
