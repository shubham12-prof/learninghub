# 04 - The `this` keyword

> **Time to learn:** ~35 min | **Level:** Core concept | **Interview frequency:** Very high

## 1. What is `this`?

`this` is a special keyword that points to **the object that is "calling" the function**. Unlike scope, `this` is **not decided where the function is written, it is decided by HOW the function is called.** (The one exception is arrow functions.)

## 2. The 5 rules (check them in this order)

| # | Rule | How the function is called | `this` is |
|---|---|---|---|
| 1 | **`new` binding** | `new Foo()` | The brand-new object being created |
| 2 | **Explicit binding** | `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)()` | `obj` |
| 3 | **Implicit binding** | `obj.fn()` | `obj` (the thing left of the dot) |
| 4 | **Default binding** | plain `fn()` | `globalThis` (sloppy mode) or `undefined` (strict mode / modules / classes) |
| 5 | **Arrow functions** | any way | **Inherited** from the surrounding scope where the arrow was written. Cannot be changed by `call/apply/bind`. |

## 3. Analogy

The word "**I**" in English. If Asha says "I am hungry", "I" means Asha. If Ravi says the exact same sentence, "I" means Ravi. The sentence did not change, **who is speaking** did. `this` works the same way: the function is the sentence, the caller is the speaker.

## 4. Examples

### 4.1 Default binding

```js
function show() {
  console.log(this);
}

show(); // globalThis (window in browser) in sloppy mode
```

```js
"use strict";
function show() {
  console.log(this);
}
show(); // undefined
```

### 4.2 Implicit binding (`obj.method()`)

```js
const user = {
  name: "Asha",
  greet() {
    console.log("Hi, I am " + this.name);
  }
};

user.greet(); // Hi, I am Asha
```

### 4.3 Losing `this` (the #1 bug)

```js
const user = {
  name: "Asha",
  greet() {
    console.log("Hi, I am " + this.name);
  }
};

const fn = user.greet; // copy the function out of the object
fn();                  // `this` is no longer `user` -> "Hi, I am undefined"
                       // (in strict mode: TypeError: Cannot read properties of undefined)
```

Same problem with callbacks:

```js
setTimeout(user.greet, 100); // this is lost here too
```

**Fixes:**

```js
setTimeout(user.greet.bind(user), 100);          // bind
setTimeout(() => user.greet(), 100);             // wrap in an arrow function
```

### 4.4 Explicit binding: `call`, `apply`, `bind`

```js
function intro(city, country) {
  console.log(this.name + " from " + city + ", " + country);
}

const person = { name: "Ravi" };

intro.call(person, "Delhi", "India");     // call: args one by one
intro.apply(person, ["Delhi", "India"]);  // apply: args as an array

const boundIntro = intro.bind(person, "Delhi"); // bind: returns a NEW function
boundIntro("India");                            // Ravi from Delhi, India
```

| Method | Runs immediately? | Arguments |
|---|---|---|
| `call` | Yes | comma separated |
| `apply` | Yes | array |
| `bind` | No (returns a new function) | comma separated (can be partial) |

### 4.5 `new` binding

```js
function Course(title) {
  this.title = title;
}

const c = new Course("JavaScript");
console.log(c.title); // JavaScript
```

### 4.6 Arrow functions: lexical `this`

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++;          // `this` = timer (inherited from start())
      console.log(this.seconds);
    }, 1000);
  }
};
```

If you used a regular `function () {}` inside `setInterval`, `this` would NOT be `timer`.

**Do not use arrow functions as object methods:**

```js
const obj = {
  name: "Asha",
  greet: () => console.log(this.name) // `this` is NOT obj (it's the outer scope)
};
obj.greet(); // undefined
```

### 4.7 `this` in event handlers (browser)

```js
button.addEventListener("click", function () {
  console.log(this); // the button element
});

button.addEventListener("click", () => {
  console.log(this); // NOT the button (inherited from outside). Use event.currentTarget instead.
});
```

### 4.8 `this` in classes

```js
class Counter {
  count = 0;

  increment() {
    this.count++;
  }

  // arrow property: `this` is permanently bound to the instance
  incrementSafe = () => {
    this.count++;
  };
}

const c = new Counter();
const { increment, incrementSafe } = c;

incrementSafe(); // works
// increment();  // TypeError: Cannot read properties of undefined (class code is strict)
```

## 5. Quick decision flow

When you see `this`, ask in order:

1. Is it an **arrow function**? -> `this` comes from the surrounding scope. Stop.
2. Called with **`new`**? -> the new object.
3. Called with **`call/apply/bind`**? -> that object.
4. Called as **`obj.method()`**? -> `obj`.
5. Otherwise -> `globalThis` / `undefined` (strict).

## 6. Common mistakes

1. Passing a method as a callback and losing `this`.
2. Using an arrow function as an object method or constructor.
3. Using a regular function inside a method and expecting the outer `this`.
4. Forgetting that class bodies and ES modules are always in strict mode.

## 7. Predict the output

**Q1**
```js
const obj = {
  name: "A",
  show() { console.log(this.name); }
};
obj.show();
```

**Q2**
```js
const obj = {
  name: "A",
  show() { console.log(this.name); }
};
const f = obj.show;
f();
```
(Assume sloppy mode in Node/browser. What happens in strict mode?)

**Q3**
```js
const obj = {
  name: "A",
  show: () => console.log(this.name)
};
obj.show();
```

**Q4**
```js
function show() { console.log(this.name); }
const a = { name: "A" };
const b = { name: "B" };
show.call(a);
show.call(b);
```

**Q5**
```js
const bound = function () { return this.x; }.bind({ x: 1 });
console.log(bound.call({ x: 2 }));
```

**Q6**
```js
const obj = {
  name: "A",
  outer() {
    return function () { return this === undefined || this === globalThis; };
  },
  outerArrow() {
    return () => this === obj;
  }
};
console.log(obj.outer()(), obj.outerArrow()());
```

## 8. Answers

- **Q1:** `A`
- **Q2:** `undefined` in sloppy mode (`this` is the global object, which has no `name` in Node). In strict mode it throws `TypeError` because `this` is `undefined`. In a browser sloppy mode it prints `""` because `window.name` exists and is an empty string.
- **Q3:** `undefined`. Arrow functions don't get their own `this`, so it comes from the module/global scope.
- **Q4:** `A` then `B`
- **Q5:** `1`. Once bound, `call` cannot override `this`.
- **Q6:** `true true`. The plain inner function loses `this` (global or undefined), while the arrow function keeps `obj`.

## Recap

- `this` is decided by **how** a function is called, except in arrow functions where it's decided by **where** they're written.
- Priority: `new` > `call/apply/bind` > `obj.method()` > default.
- Arrow functions have no own `this` and can't be rebound.
- Extracting a method from an object loses `this`. Fix with `bind` or an arrow wrapper.

## Checklist

- [ ] I can list the 5 rules in order
- [ ] I can explain `call` vs `apply` vs `bind`
- [ ] I can explain why `setTimeout(obj.method)` breaks
- [ ] I know when NOT to use an arrow function
- [ ] I got Q1 to Q6 right without looking
