# 01 - Recall Test: Days 1 to 3 (JavaScript, Async JavaScript, React)

> **Time:** ~60 min | **Type:** Memory test, **no notes** | **Questions:** 30
> The answers were checked by running the code (Node 22). Where a question says "what is printed", the printed value is the real output.

## How to use this file (the rules matter)

1. **Do not scroll to the answer key.** Cover it, or read only Part 1.
2. For each question **say the answer out loud** (30 seconds max), or write 2 lines. Thinking "I know this" is not recall.
3. Then open Part 2 and score yourself: **0** = blank or wrong, **1** = partly right, **2** = right and clear.
4. Write the questions you scored 0 or 1 in the "Weak spots" table at the end. Re-read **only** those files, then re-test them tomorrow.
5. Score: **54 to 60** = interview-ready · **42 to 53** = fix the weak spots · **below 42** = redo that day's files tonight.

---

## Part 1: Questions

### Day 1: JavaScript fundamentals

**1.** What are the differences between `var`, `let` and `const` (scope, hoisting, reassignment)? Can you change an object declared with `const`?

**2.** What does each print?

```js
console.log(typeof a);
var a = 1;
```

```js
console.log(b);
let b = 1;
```

**3.** What is a closure? Give one practical use.

**4.** What is printed, and how do you get `0, 1, 2`?

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
```

**5.** How is `this` decided? Name the four rules and say what is special about arrow functions.

**6.** In a module, what is `f()` below, and why?

```js
const obj = {
  name: "ada",
  hi() {
    return this?.name;
  },
};
const f = obj.hi;
console.log(obj.hi(), f());
```

**7.** What are the two phases of an execution context, and what is the call stack?

**8.** `==` vs `===`: what are the results of `null == undefined`, `null === undefined`, `"1" == 1`, `NaN === NaN`, `Object.is(NaN, NaN)`?

**9.** What does `[1, 2, 3].map(parseInt)` return, and why?

**10.** Why is `0.1 + 0.2 !== 0.3`? What do you do about it? What is `typeof null`?

**11.** Reverse a string two ways. What goes wrong with `"a😀b".split("").reverse()`, and is spread (`[...str]`) always enough?

**12.** Remove duplicates from `[1, 2, 2, 3]` in one line. What changes for an array of objects?

**13.** Count how often each word appears. Why is a plain `{}` risky as the counter?

### Day 2: Asynchronous JavaScript

**14.** Explain the event loop. What is the difference between microtasks and macrotasks?

**15.** In what order is this printed?

```js
console.log("sync");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("microtask"));
```

**16.** What does this print?

```js
(async () => {
  console.log("a");
  await null;
  console.log("c");
})();
console.log("b");
```

**17.** Compare `Promise.all`, `allSettled`, `race` and `any`. What happens to each when one promise rejects?

**18.** Does `fetch` reject on a 404? How do you handle HTTP errors properly?

**19.** Why doesn't `array.forEach(async (x) => { await work(x); })` wait? Give two fixes.

**20.** Two independent requests: how do you run them in parallel instead of one after the other?

**21.** What does an `async` function return? What happens if it throws? When do you use `finally`?

**22.** Debounce vs throttle: what is each, and where do you use them?

**23.** How do you add a timeout or cancel a `fetch`? What is the "latest request wins" problem?

### Day 3: React fundamentals

**24.** Why does calling `setCount(count + 1)` three times add only 1? How do you add 3?

**25.** Explain `useEffect`: the dependency array, cleanup, and what Strict Mode does in development.

**26.** What are keys for? Why is the array index a bad key?

**27.** When does a component re-render?

**28.** Props vs state. Controlled vs uncontrolled components.

**29.** Why must you never mutate state? Show the correct way to add, update and remove an item in an array in state.

**30.** What are the rules of hooks? What is "derived state", and why shouldn't you copy props into state or compute derived values in an effect?

---

## Part 2: Answer key (cover until you've answered)

### Day 1

**1.** `var` is **function-scoped**, hoisted and initialised to `undefined`, and can be redeclared. `let`/`const` are **block-scoped**, hoisted but in the **temporal dead zone** until their line runs (using them early throws). `const` can't be **reassigned**, but an object or array it points to **can be mutated**. _(Day 1: `09-interview-var-let-const.md`)_

**2.** First: **`undefined`** (the declaration is hoisted, the assignment is not). Second: **`ReferenceError: Cannot access 'b' before initialization`**. _(`02-hoisting.md`)_

**3.** A function that **remembers the variables of the scope where it was created**, even after that scope has finished. Uses: private state (counter, `debounce` timer id), factories, callbacks and event handlers that need context, memoization. _(`03-closures.md`, `10-interview-closures.md`)_

**4.** **`3, 3, 3`**: `var` has one shared `i` and the callbacks run after the loop ends. Fix: use **`let`** (a new `i` per iteration), or wrap in an IIFE that passes `i`. With `let` it prints `0, 1, 2`.

**5.** 1) **new** (`new F()`: the new object), 2) **explicit** (`call` / `apply` / `bind`), 3) **implicit** (`obj.method()`: `obj`), 4) **default** (plain call: `undefined` in strict mode and modules, the global object otherwise). **Arrow functions have no own `this`**: they use the `this` of the enclosing scope, and `call`/`bind` can't change it. _(`04-this-keyword.md`)_

**6.** `ada` and **`undefined`**. `obj.hi()` has `obj` before the dot. The extracted `f()` has no object, so `this` is `undefined` (strict/module), and `this?.name` safely gives `undefined`. Without the `?.`, it would throw a `TypeError`. Fix: `obj.hi.bind(obj)` or an arrow wrapper.

**7.** **Creation** (memory is set up: `var` = `undefined`, function declarations fully hoisted, `let`/`const` in the TDZ) and **execution** (code runs line by line). The **call stack** is a LIFO stack of execution contexts: the function on top is the one running. _(`05-execution-context.md`)_

**8.** `true`, `false`, `true`, `false`, `true`. `==` coerces types; `===` doesn't. `NaN` is not equal to itself, so use `Number.isNaN` or `Object.is`.

**9.** **`[1, NaN, NaN]`**. `map` passes `(value, index, array)`, so `parseInt` receives the **index as the radix**: `parseInt(2, 1)` and `parseInt(3, 2)` are `NaN`. Write `.map((x) => parseInt(x, 10))` or `.map(Number)`.

**10.** Numbers are IEEE-754 binary floating point; `0.1 + 0.2` is `0.30000000000000004`. Compare with a tolerance (`Math.abs(a - b) < Number.EPSILON`), or use integers (cents). `typeof null` is **`"object"`** (a historic bug).

**11.** `str.split("").reverse().join("")`, a `for` loop backwards, or two pointers. `split("")` splits by UTF-16 code units, so an emoji (2 units) gets torn in half: `"a😀b".split("")` has length **4**. `[...str]` splits by **code points** and gives `b😀a`, but **not always enough**: a family emoji is 5 code points but one visible character. Use `Intl.Segmenter` for real characters. _(`06-coding-reverse-a-string.md`)_

**12.** `[...new Set([1, 2, 2, 3])]`, which gives `[1, 2, 3]` in O(n). For objects, `Set` compares by reference, so dedupe by a **key** (`Map` keyed by `id`). _(`07-coding-remove-duplicates.md`)_

**13.** Loop and increment a **`Map`** (or an object). A plain `{}` inherits `constructor`, `toString`...: `counts["constructor"] = (counts["constructor"] || 0) + 1` gives the **string** `"function Object()...1"`. Use a `Map` or `Object.create(null)`. _(`08-coding-frequency-counter.md`)_

### Day 2

**14.** JavaScript runs one thing at a time on the **call stack**. Async work (timers, network) is handed to the platform; when it finishes its callback waits in a queue. The **event loop** moves callbacks onto the stack when it is empty. **Microtasks** (promise `.then`, `await` continuations, `queueMicrotask`) are drained **completely after each task, before the next macrotask**; **macrotasks** (`setTimeout`, I/O, UI events) run one per turn. _(`03-event-loop.md`, `04-microtasks.md`)_

**15.** `sync`, `promise`, `microtask`, `timeout`. Synchronous code first, then the whole microtask queue (in the order queued), then the timer.

**16.** **`a`, `b`, `c`**. The `async` function runs synchronously until the first `await`; the rest is scheduled as a microtask, so `b` prints before `c`.

**17.** `Promise.all`: resolves with all values; **rejects immediately** with the first rejection. `allSettled`: **never rejects**, gives `{status, value/reason}` for each. `race`: settles with the **first to settle** (so a fast rejection wins). `any`: resolves with the **first fulfilment** and ignores rejections; if **all** reject, throws `AggregateError`. _(`08-interview-promise-all.md`)_

**18.** **No.** `fetch` only rejects for network-level failures (offline, DNS, CORS, abort). A 404/500 resolves with `res.ok === false`. Check `if (!res.ok) throw new Error(...)` (and parse the body). _(`09-interview-error-handling.md`)_

**19.** `forEach` ignores the returned promises, so the code after it runs immediately (verified: `"after forEach"` prints before `1, 2, 3`). Fixes: a **`for...of` loop with `await`** (sequential) or **`await Promise.all(items.map(async (x) => ...))`** (parallel).

**20.** Start both, then await together: `const [a, b] = await Promise.all([getA(), getB()])`. Sequential `await`s take the **sum** of the times; `Promise.all` takes the **longest** one.

**21.** Always a **Promise**. A `throw` becomes a **rejection**, caught with `try/catch` around `await` or `.catch`. `finally` runs on success **and** failure: use it for cleanup such as turning off a loading spinner. _(`02-async-await.md`)_

**22.** **Debounce**: run only after calls have **stopped** for N ms (search-as-you-type, resize end, autosave). **Throttle**: run **at most once per N ms** during continuous activity (scroll, mousemove).

**23.** `AbortController`: pass `signal` to `fetch`; call `abort()` to cancel, or `AbortSignal.timeout(ms)` for a timeout. The aborted fetch rejects with `AbortError`/`TimeoutError`. "Latest request wins": a slow earlier response can arrive **after** a newer one and overwrite it, so abort the previous request or ignore responses whose request id isn't the latest. _(`11-project-api-fetching.md`)_

### Day 3

**24.** `count` is a **snapshot** for that render, so all three calls set `0 + 1`. Use the **functional updater**: `setCount((c) => c + 1)` three times gives **+3**, because each call receives the latest queued value. _(`07-interview-usestate.md`)_

**25.** `useEffect(fn, deps)` runs **after render**. `[]` = once after mount; `[a, b]` = when `a` or `b` change; no array = after every render. The returned **cleanup** function runs before the next effect and on unmount (remove listeners, clear timers, abort fetches). In development **Strict Mode** mounts, unmounts and re-mounts once to expose missing cleanups. Declare **all** values the effect uses in the deps. _(`08-interview-useeffect.md`)_

**26.** Keys let React **identify** which item is which between renders, so it can keep state and DOM for the right item. With index keys, inserting, removing or reordering shifts the indexes, so state (e.g. input text) **sticks to the wrong item**. Use a stable unique id. _(`09-interview-keys-rerendering.md`)_

**27.** When its **state** changes, when a **parent re-renders** (children re-render by default, even with the same props), or when a **context** it reads changes. Avoid needless ones by moving state down, passing `children`, or `React.memo` (Day 4).

**28.** **Props** come from the parent and are read-only; **state** is owned by the component and changes over time. **Controlled**: React state is the single source of truth (`value` + `onChange`). **Uncontrolled**: the DOM keeps the value (read via a ref or `FormData`). _(`05-controlled-components.md`, `01-props.md`)_

**29.** React compares **references**; mutating in place keeps the same reference, so React may skip the update, and bugs appear. Add `setItems([...items, item])`; update `setItems(items.map((i) => (i.id === id ? { ...i, done: true } : i)))`; remove `setItems(items.filter((i) => i.id !== id))`.

**30.** Call hooks **only at the top level** (not in loops, conditions or nested functions) and **only from components or custom hooks**, so React can match hooks by call order. **Derived state** is a value you can compute from props/state (filtered list, total): compute it **during render** (use `useMemo` only if it is expensive). Copying it into state or syncing it in an effect causes an extra render and values that go out of sync.

---

## Weak spots (fill this in)

| Q#  | Score (0/1/2) | File to re-read | Re-tested tomorrow? |
| --- | ------------- | --------------- | ------------------- |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |

## Recap

- Recall beats re-reading: **say it aloud, then check**.
- Day 1 is about **scope, hoisting, closures, `this`**; Day 2 about the **event loop and promises**; Day 3 about **state, effects, keys and re-renders**.
- Anything you scored 0 or 1 gets **one targeted re-read** and a retest, not a full re-study.

## Checklist

- [ ] I answered every question aloud before checking
- [ ] I scored myself honestly (0 / 1 / 2)
- [ ] I wrote my weak spots in the table
- [ ] My score is 54 or more, or I have a plan to re-test the weak ones tomorrow
