# Bind

`Function.prototype.bind()` does **not** invoke the function immediately — it returns a **new function** with `this` (and optionally some leading arguments) permanently bound.

```js
const person = { name: "Bob" };
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const bound = greet.bind(person, "Hey"); // returns a NEW function, doesn't invoke
bound("!!!"); // "Hey, Bob!!!"
```

**Common use case:** preserving `this` in callbacks / event handlers.

```js
class Button {
  constructor() {
    this.label = "Submit";
    this.handleClick = this.handleClick.bind(this); // lock `this` to the instance
  }
  handleClick() {
    console.log(`${this.label} clicked`);
  }
}
```

---

## call vs apply vs bind — Comparison

| Method | Invokes immediately?      | Argument style  |
| ------ | ------------------------- | --------------- |
| call   | Yes                       | comma-separated |
| apply  | Yes                       | array           |
| bind   | No — returns new function | comma-separated |
