# Call

`Function.prototype.call()` invokes a function immediately, explicitly setting `this`, with arguments passed **individually** (comma-separated).

```js
const person = { name: "Bob" };
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

greet.call(person, "Hello", "!"); // "Hello, Bob!" — invokes immediately, args passed individually
```

**Use case:** borrowing a method from one object to use on another.

```js
const numbers = { values: [3, 1, 4] };
Math.max.call(null, ...numbers.values); // 4
```
