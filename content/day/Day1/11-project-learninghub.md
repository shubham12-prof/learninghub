# 11 - Project: JavaScript Interaction in LearningHub

> **Time:** ~90 min | **Goal:** Use Day 1 concepts (scope, hoisting, closures, `this`, `var/let/const`) in a real UI interaction.

This project has **two parts**:

- **Part A: Build** a "Mark complete" + progress tracker for course cards.
- **Part B: Debug** a broken version that contains 4 bugs, each one a Day 1 concept.

> **Using your real LearningHub code?** Everything here is self-contained so you can practise right away. When you finish, copy the same ideas into your real project (see section 6).

## 1. Setup

Make a folder called `learninghub-day1` with three files: `index.html`, `app.js` (Part A) and `app-buggy.js` (Part B). Open `index.html` in a browser and use DevTools (F12) -> Console to see errors.

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LearningHub - Day 1</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 2rem auto; padding: 0 1rem; }
    ul { list-style: none; padding: 0; }
    .course { display: flex; justify-content: space-between; align-items: center;
              padding: .75rem 1rem; margin-bottom: .5rem; border: 1px solid #ddd; border-radius: 8px; }
    .course.done { background: #e8f7ee; border-color: #8fd4a8; }
    .course.done span { text-decoration: line-through; color: #666; }
    progress { width: 100%; height: 14px; }
    button { cursor: pointer; padding: .4rem .8rem; }
  </style>
</head>
<body>
  <h1>LearningHub</h1>
  <p id="progress">0 of 3 courses completed</p>
  <progress id="bar" value="0" max="3"></progress>

  <ul id="courses">
    <li class="course"><span>JavaScript Basics</span><button class="complete-btn">Mark complete</button></li>
    <li class="course"><span>HTML &amp; CSS</span><button class="complete-btn">Mark complete</button></li>
    <li class="course"><span>React Intro</span><button class="complete-btn">Mark complete</button></li>
  </ul>

  <button id="reset">Reset progress</button>

  <!-- Part A: use app.js. Part B: swap to app-buggy.js -->
  <script src="app.js"></script>
</body>
</html>
```

## 2. Part A: Build it

### Requirements

1. Clicking **Mark complete** on a course card:
   - adds the `done` class to the card,
   - changes the button text to **Undo**,
   - updates the text ("1 of 3 courses completed") and the `<progress>` bar.
2. Clicking **Undo** reverses all of that.
3. **Reset progress** clears everything.
4. The progress count must live in **one place only** and **not be a global variable** (use a closure).

### Concept map (what you practise)

| Requirement | Day 1 concept |
|---|---|
| Counter not global | **Closure** + **scope** |
| One handler per card that remembers which card it is | **Closure** / `let` in loops |
| Button text change inside the handler | **`this`** in a regular function handler |
| `const` for elements, `let` only when values change | **`var` / `let` / `const`** |
| Helper functions defined clearly | **Hoisting** |

### Hints (read only if stuck)

1. Write a `createTracker(total, onChange)` function that returns an object with `toggle(id)`. Keep a `Set` of completed IDs inside.
2. Use `courses.forEach((course, index) => { ... })` so every card has its own `index`.
3. In `addEventListener("click", function () { ... })` the `this` is the button that was clicked.

## 3. Part A: Solution (try first!)

### `app.js`

```js
"use strict";

// ---- Closure: private state, nothing leaks to the global scope ----
function createTracker(total, onChange) {
  const done = new Set(); // private: only toggle() and count() can reach it

  return {
    toggle(id) {
      if (done.has(id)) {
        done.delete(id);
      } else {
        done.add(id);
      }
      onChange(done.size, total);
      return done.has(id);
    },
    count() {
      return done.size;
    },
    reset() {
      done.clear();
      onChange(0, total);
    }
  };
}

// ---- DOM references: never reassigned, so const ----
const courses = document.querySelectorAll(".course");
const progressText = document.getElementById("progress");
const bar = document.getElementById("bar");
const resetBtn = document.getElementById("reset");

// ---- Called by the tracker whenever the count changes ----
function render(done, total) {
  progressText.textContent = `${done} of ${total} courses completed`;
  bar.value = done;
}

const tracker = createTracker(courses.length, render);

// ---- One handler per card; each remembers its own `index` ----
courses.forEach((course, index) => {
  const btn = course.querySelector(".complete-btn");

  btn.addEventListener("click", function () {
    const isDone = tracker.toggle(index);
    course.classList.toggle("done", isDone);
    this.textContent = isDone ? "Undo" : "Mark complete"; // `this` = the clicked button
  });
});

// ---- Reset: arrow function keeps it simple, no `this` needed ----
resetBtn.addEventListener("click", () => {
  tracker.reset();
  courses.forEach((course) => {
    course.classList.remove("done");
    course.querySelector(".complete-btn").textContent = "Mark complete";
  });
});
```

### Why it works

- `done` (the `Set`) is only reachable through `toggle`, `count` and `reset`, which is a **closure** giving us private state.
- Each `forEach` callback receives its own `index`, so every handler is a closure over a different value (the same effect `let` gives in a loop).
- The regular `function () {}` handler gets `this` = the button, so `this.textContent` works. (An arrow function there would **break** this, because arrow functions don't get their own `this`.)
- `render` is a function declaration, so it is **hoisted** and can be used anywhere in the file.

## 4. Part B: Debug it

Create `app-buggy.js` with the code below, then change the `<script src>` in `index.html` to `app-buggy.js`. The code contains **4 bugs**. Fix them **one at a time**: each fix reveals the next error, exactly like real debugging.

### `app-buggy.js`

```js
"use strict";

setupButtons();                                     // runs the setup

const courses = document.querySelectorAll(".course");
const progressText = document.getElementById("progress");
const resetBtn = document.getElementById("reset");

total = courses.length;                             // how many courses exist

const setupButtons = () => {
  const buttons = document.querySelectorAll(".complete-btn");

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      markDone(i);
    });
  }
};

function markDone(index) {
  if (courses[index].classList.contains("done")) return;
  courses[index].classList.add("done");
  tracker.completed++;
  tracker.render();
}

const tracker = {
  completed: 0,
  render() {
    progressText.textContent = `${this.completed} of ${total} courses completed`;
  },
  reset() {
    this.completed = 0;
    courses.forEach((c) => c.classList.remove("done"));
    this.render();
  }
};

resetBtn.addEventListener("click", tracker.reset);
```

### Your debugging process

For each bug write down: **(1)** what you saw, **(2)** which Day 1 concept explains it, **(3)** your fix.

| # | Hint: what you'll see | Which file explains it? |
|---|---|---|
| 1 | Page does nothing; console shows a `ReferenceError` about `setupButtons` | `02-hoisting.md` (TDZ) |
| 2 | After fixing #1, console shows a `ReferenceError: total is not defined` | `01-scope.md` (accidental globals) + `09-interview-var-let-const.md` |
| 3 | Clicking a course button shows `TypeError: Cannot read properties of undefined` | `03-closures.md` (the 3-3-3 loop problem) |
| 4 | Clicking **Reset progress** shows `TypeError: this.render is not a function` | `04-this-keyword.md` (lost `this`) |

Don't scroll down until you've tried each one.

## 5. Part B: Solutions

### Bug 1: Temporal Dead Zone

`setupButtons` is a `const` arrow function, so it is hoisted but **not initialised** until its line runs. Calling it at the top throws a `ReferenceError`.

```js
// Fix: define first, call after (or turn it into a function declaration)
const setupButtons = () => { /* ... */ };
setupButtons();
```

### Bug 2: Accidental global

`total = courses.length;` has no declaration. In sloppy mode it silently creates a global; with `"use strict"` it throws `ReferenceError`.

```js
const total = courses.length;
```

### Bug 3: `var` in a loop + closures

All click handlers share the same `var i`. After the loop finishes `i` is `3`, so `courses[3]` is `undefined` and `.classList` throws.

```js
for (let i = 0; i < buttons.length; i++) {      // let -> new `i` per iteration
  buttons[i].addEventListener("click", function () {
    markDone(i);
  });
}
```

(Alternative: `buttons.forEach((btn, i) => btn.addEventListener("click", () => markDone(i)));`)

### Bug 4: Lost `this`

`resetBtn.addEventListener("click", tracker.reset)` passes the method **without its object**. When the browser calls it, `this` is the button, not `tracker`.

```js
// Option 1: arrow wrapper
resetBtn.addEventListener("click", () => tracker.reset());

// Option 2: bind
resetBtn.addEventListener("click", tracker.reset.bind(tracker));
```

### Fixed `app-buggy.js` (complete)

```js
"use strict";

const courses = document.querySelectorAll(".course");
const progressText = document.getElementById("progress");
const resetBtn = document.getElementById("reset");

const total = courses.length;

const tracker = {
  completed: 0,
  render() {
    progressText.textContent = `${this.completed} of ${total} courses completed`;
  },
  reset() {
    this.completed = 0;
    courses.forEach((c) => c.classList.remove("done"));
    this.render();
  }
};

function markDone(index) {
  if (courses[index].classList.contains("done")) return;
  courses[index].classList.add("done");
  tracker.completed++;
  tracker.render();
}

const setupButtons = () => {
  const buttons = document.querySelectorAll(".complete-btn");

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      markDone(i);
    });
  }
};

setupButtons();
resetBtn.addEventListener("click", () => tracker.reset());
```

## 6. Stretch goals (use these on your real LearningHub)

1. **Debounced search:** filter the course list as the user types, but only after they stop typing for 300 ms. Reuse the `debounce` from `10-interview-closures.md`.
2. **Persist progress:** save completed course IDs in `localStorage` and restore them on page load. (Hint: `JSON.stringify([...done])` / `JSON.parse`.)
3. **Event delegation:** replace the per-button listeners with one listener on `#courses` using `event.target.closest(".complete-btn")`. Notice how `this`/`event.currentTarget` differ.
4. **`once` init:** wrap your page setup in `once()` so calling it twice can't attach duplicate listeners.
5. **Write a 5-line summary** in your own words: *"Which closure did I use, and why?"*, which is the kind of answer interviewers love.

### Applying it to your real project

1. Find an interaction in LearningHub that uses a global variable (a counter, a flag, a list).
2. Move that state inside a function and return methods to change it (closure).
3. Check every `var` -> change to `const`/`let`.
4. Check every callback that uses `this` -> is it a method passed without its object? Fix with `bind` or an arrow wrapper.
5. Run it, click around, and confirm that nothing in the console is red.

## 7. Self-check

- [ ] Part A works: mark, undo, progress bar and reset
- [ ] There are no global variables I created myself (check with `console.log(Object.keys(window))` for names you recognise)
- [ ] I fixed all 4 bugs and can name the concept behind each one
- [ ] I can explain my solution in 60 seconds, out loud
- [ ] I tried at least one stretch goal

## Recap

- Closures give you **private state** without globals.
- Handlers created in a loop need **their own variable** (`let`, `forEach` parameter or IIFE).
- A method passed as a callback **loses `this`**: wrap it or `bind` it.
- `const` arrow functions are **not usable before their line**; function declarations are.
- Strict mode turns silent mistakes (accidental globals) into loud errors, which is a good thing.
