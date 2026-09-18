/*
  Top 30 - #12: Throttle

  PROBLEM: run a callback AT MOST once every X milliseconds, no matter
  how often it's called. Classic use: scroll/resize handlers.
*/

function throttle(fn, delay) {
  let isOnCooldown = false;

  return function (...args) {
    const context = this;
    if (isOnCooldown) return; // ignore calls during cooldown

    fn.apply(context, args);
    isOnCooldown = true;

    setTimeout(() => {
      isOnCooldown = false;
    }, delay);
  };
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
function logScroll() {
  console.log("Scroll handled at", Date.now());
}

const throttledScroll = throttle(logScroll, 1000);
// Even if called 50 times/second while scrolling, this only actually
// runs logScroll once every 1000ms.

/*
  TIME COMPLEXITY: O(1) per call - just a boolean check.
*/
