# Memory Leaks

Memory that's no longer needed but still referenced, so the GC can't reclaim it. Common causes:

**a) Forgotten timers/intervals**

```js
function startPolling() {
  setInterval(() => fetchData(), 1000);
} // if never cleared, the closure (and everything it references) leaks forever
// Fix:
const id = setInterval(() => fetchData(), 1000);
clearInterval(id); // when done
```

**b) Detached DOM nodes still referenced in JS**

```js
let cachedElement = document.getElementById("item");
document.getElementById("item").remove(); // removed from DOM
// but `cachedElement` still references it -> not garbage collected
cachedElement = null; // fix
```

**c) Uncleaned event listeners**

```js
function attach() {
  const btn = document.querySelector("#btn");
  btn.addEventListener("click", handleClick);
} // if the element is later removed from the DOM but the listener isn't removed,
// and something else still references btn, it can leak
// Fix: btn.removeEventListener('click', handleClick) before discarding
```

**d) Global variables accumulating data**

```js
function badCache() {
  window.cache = window.cache || [];
  window.cache.push(new Array(1000000)); // never cleared -> grows forever
}
```

**e) Closures unintentionally holding large data**

```js
function outer() {
  const largeData = new Array(1000000).fill("x");
  return function inner() {
    console.log("hi"); // doesn't use largeData, but if largeData isn't
  }; // otherwise referenced, modern engines can often
} // optimize this away — but it's a common gotcha to know.
```
