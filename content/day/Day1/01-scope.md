# 01 - Scope

> **Time to learn:** ~25 min | **Level:** Fundamentals | **Interview frequency:** Very high

## 1. What is scope?

**Scope decides where a variable can be seen and used.** When JavaScript meets a variable name, it looks for it in the current scope first, then in the scope outside it, and so on until it reaches the global scope. This chain of lookups is called the **scope chain**.

JavaScript has three kinds of scope:

| Scope | Created by | Variables that live here |
|---|---|---|
| **Global** | The top level of your file/script | `var`, `let`, `const`, functions |
| **Function** | Every function | `var`, `let`, `const`, parameters |
| **Block** | Any `{ }` (if, for, while, plain block) | `let`, `const` only (`var` ignores blocks) |

JavaScript uses **lexical scope** (also called static scope): the scope of a variable is decided by *where you write the code*, not by where you call it from.

## 2. Analogy

Think of nested rooms in a house. If you are in the bedroom and need a charger, you look in the bedroom first. If it's not there, you check the hallway, then the living room, then the whole house. You can **never** look inside another room that you aren't standing in or inside of. Inner rooms can see outward, but outer rooms cannot see inward.

## 3. Examples

### 3.1 Global vs function scope

```js
var appName = "LearningHub";        // global

function showCourse() {
  var course = "JavaScript";        // function scope
  console.log(appName, course);     // LearningHub JavaScript
}

showCourse();
console.log(typeof course);         // "undefined" (course is not visible outside)
```

### 3.2 Block scope: `var` vs `let`/`const`

```js
if (true) {
  var a = 1;
  let b = 2;
  const c = 3;
}

console.log(a);           // 1            -> var ignores the block
console.log(typeof b);    // "undefined"  -> let is block scoped
console.log(typeof c);    // "undefined"  -> const is block scoped
// console.log(b);        // would throw ReferenceError: b is not defined
```

### 3.3 Scope chain (lexical scope)

```js
const level1 = "global";

function outer() {
  const level2 = "outer";

  function inner() {
    const level3 = "inner";
    console.log(level1, level2, level3); // global outer inner
  }

  inner();
}

outer();
```

`inner` can read `level2` and `level1` because it was **written inside** `outer` and the global file. `outer` cannot read `level3`.

### 3.4 Shadowing

An inner variable with the same name hides the outer one.

```js
let x = "outer";

{
  let x = "inner";
  console.log(x); // inner
}

console.log(x);   // outer
```

### 3.5 Lexical scope: where it is written matters, not where it is called

```js
const name = "global";

function printName() {
  console.log(name);
}

function run() {
  const name = "run";
  printName();          // prints "global", NOT "run"
}

run();
```

## 4. Common mistakes

1. **Accidental globals.** Forgetting `let/const/var` creates a global variable (in non-strict mode).
   ```js
   function oops() { total = 10; }   // no declaration
   oops();
   console.log(total);               // 10 (leaked to global). In strict mode this throws ReferenceError.
   ```
2. **Assuming `var` is block scoped.** It is not. It is function scoped.
3. **Using a block variable outside its block** and getting `ReferenceError`.
4. **Confusing lexical scope with call location** (see 3.5).

## 5. Predict the output

**Q1**
```js
let x = "global";
function outer() {
  let x = "outer";
  function inner() {
    console.log(x);
  }
  inner();
}
outer();
```

**Q2**
```js
function test() {
  if (true) {
    var a = 10;
  }
  console.log(a);
}
test();
```

**Q3**
```js
function foo() {
  y = 5;
}
foo();
console.log(y);
```

**Q4**
```js
let a = 1;
{
  let a = 2;
  console.log(a);
}
console.log(a);
```

**Q5**
```js
for (var i = 0; i < 3; i++) {}
console.log(i);

for (let j = 0; j < 3; j++) {}
console.log(typeof j);
```

## 6. Answers

- **Q1:** `outer`. `inner` finds `x` in `outer` first (the closest scope).
- **Q2:** `10`. `var` is function scoped, so `a` is visible in the whole function.
- **Q3:** `5` in normal (sloppy) mode because `y` becomes an accidental global. In strict mode (or ES modules) it throws `ReferenceError`.
- **Q4:** `2` then `1`. The inner `a` shadows the outer one only inside the block.
- **Q5:** `3` then `"undefined"`. `var i` leaks out of the loop; `let j` does not.

## Recap

- Scope = where a variable is accessible. Types: global, function, block.
- `var` is function scoped; `let` and `const` are block scoped.
- JavaScript uses **lexical scope**: decided by where code is written.
- Lookup walks the **scope chain** from inner to outer, never the other way.
- Always declare variables. Prefer `const`, then `let`. Avoid `var`.

## Checklist

- [ ] I can name the 3 kinds of scope
- [ ] I can explain the scope chain in one sentence
- [ ] I can explain why `var` leaks out of an `if` block
- [ ] I got Q1 to Q5 right without looking
