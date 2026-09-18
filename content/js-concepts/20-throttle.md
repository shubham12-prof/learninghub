# Throttle

## Explanation
Throttling limits how often a function can run — it guarantees the function executes *at most once* per specified time interval, no matter how many times it's triggered. Unlike debounce (which waits for a pause), throttle runs at a steady, regular pace during continuous activity.

Think: a scroll event handler that updates a progress bar — you don't need it firing hundreds of times per second, just every, say, 100ms.

## Examples
```js
function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

function handleScroll() {
  console.log("Scroll position:", window.scrollY);
}

const throttledScroll = throttle(handleScroll, 200);
window.addEventListener("scroll", throttledScroll);
// Fires at most once every 200ms, no matter how fast the user scrolls
```

## Debounce vs. Throttle — the key difference
- **Debounce**: "Wait until things go quiet, then run once." Good for search inputs, form validation.
- **Throttle**: "Run regularly, at most once per interval, even during continuous activity." Good for scroll, resize, mouse-move handlers.

## Why it matters
Both debounce and throttle are essential performance techniques for handling high-frequency events (scroll, resize, mousemove, keypress) without overwhelming the browser or a backend API. This is another very common interview implementation question.

## Questions
1. What's the core difference between debounce and throttle?
2. Why would you choose throttle over debounce for a scroll event handler?
3. In the throttle implementation above, what does the `inThrottle` flag do?
4. If a user scrolls continuously for 2 seconds with a 200ms throttle, roughly how many times will the handler fire?
5. Would debounce be a good fit for a scroll-position progress bar? Why or why not?
