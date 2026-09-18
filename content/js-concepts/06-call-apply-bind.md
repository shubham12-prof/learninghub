# call / apply / bind

## Explanation
These three methods let you explicitly control what `this` refers to inside a function.

- **`call(thisArg, arg1, arg2, ...)`** — calls the function immediately, arguments passed individually.
- **`apply(thisArg, [argsArray])`** — calls the function immediately, arguments passed as an array.
- **`bind(thisArg, arg1, ...)`** — does NOT call the function immediately. Instead it returns a *new function* with `this` permanently set, which you can call later.

## Examples
```js
function introduce(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}

const user = { name: "Priya" };

introduce.call(user, "Hello");           // "Hello, I'm Priya"
introduce.apply(user, ["Hi"]);           // "Hi, I'm Priya"

const boundIntroduce = introduce.bind(user);
boundIntroduce("Hey");                   // "Hey, I'm Priya" — can call it anytime later
```

### Common use case: fixing `this` in callbacks
```js
class Button {
  constructor(label) { this.label = label; }
  handleClick() { console.log(`${this.label} clicked`); }
}

const btn = new Button("Submit");
const handler = btn.handleClick.bind(btn); // lock 'this' to btn
document.addEventListener("click", handler);
```

## Why it matters
Before arrow functions became common, `bind` was the standard fix for losing `this` in callbacks. You'll still see it a lot in real codebases, React class components, and event handler setups.

## Questions
1. What's the key difference between `call` and `apply`?
2. Why doesn't `bind` execute the function right away?
3. When would you use `bind` instead of just wrapping a call in an arrow function?
4. Predict the output:
```js
function add(a, b) { return this.base + a + b; }
const withBase = add.bind({ base: 10 });
console.log(withBase(5, 5));
```
5. How could `apply` be useful when you have an array of arguments but don't know its length in advance?
