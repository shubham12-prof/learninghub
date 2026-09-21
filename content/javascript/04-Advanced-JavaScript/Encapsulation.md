# Encapsulation

Bundling data and methods together, restricting direct access to internal state.

```js
class Counter {
  #count = 0; // private — inaccessible from outside the class
  increment() {
    this.#count++;
  }
  get value() {
    return this.#count;
  }
}
const c = new Counter();
c.increment();
c.value; // 1
// c.#count // SyntaxError — private field
```
