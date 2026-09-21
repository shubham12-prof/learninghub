# Throttle

Ensures a function runs **at most once** per specified time interval, regardless of how many times it's triggered — useful for scroll/mousemove handlers.

```js
function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const handleScroll = throttle(() => {
  console.log("Scroll position:", window.scrollY);
}, 200);

window.addEventListener("scroll", handleScroll);
// Fires at most once every 200ms, even during continuous scrolling
```

**Debounce vs Throttle:**

|          | Debounce               | Throttle                             |
| -------- | ---------------------- | ------------------------------------ |
| Fires    | After activity stops   | At regular intervals during activity |
| Use case | search input, autosave | scroll, resize, mousemove            |
