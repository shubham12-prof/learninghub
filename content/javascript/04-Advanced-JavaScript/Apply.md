# Apply

`Function.prototype.apply()` invokes a function immediately, explicitly setting `this`, with arguments passed as a **single array**.

```js
const person = { name: "Bob" };
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

greet.apply(person, ["Hi", "?"]); // "Hi, Bob?" — invokes immediately, args passed as array
```

**Classic use case (pre-spread-operator):** passing an array as individual arguments.

```js
Math.max.apply(null, [3, 1, 4, 1, 5]); // 5
// Modern equivalent: Math.max(...[3,1,4,1,5])
```

**call vs apply:** identical behavior, differing only in how arguments are supplied — comma-separated (`call`) vs. an array (`apply`).
