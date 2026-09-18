/*
  Top 30 - #14: Memoization

  PROBLEM: create a wrapper function that CACHES the results of an
  expensive function, so calling it again with the SAME arguments
  returns the cached answer instantly, instead of recalculating.
*/

function memoize(fn) {
  const cache = new Map(); // maps: "stringified arguments" -> result

  return function (...args) {
    // Turn the arguments into a single string to use as a cache key.
    // (works well for simple/primitive arguments - objects/arrays as
    // args need a smarter key strategy in real-world code)
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("Returning from cache for:", key);
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// -----------------------------------------------------------------
// Example usage - an artificially "slow" function
// -----------------------------------------------------------------
function slowSquare(n) {
  console.log("Calculating square of", n, "...");
  for (let i = 0; i < 1e8; i++) {} // simulate expensive work
  return n * n;
}

const memoizedSquare = memoize(slowSquare);

console.log(memoizedSquare(5)); // "Calculating square of 5..." then 25 (slow)
console.log(memoizedSquare(5)); // "Returning from cache for..." then 25 (instant!)
console.log(memoizedSquare(6)); // "Calculating square of 6..." then 36 (slow, new input)


// -----------------------------------------------------------------
// Practical use case: memoized Fibonacci (dramatically speeds up
// naive recursive Fibonacci)
// -----------------------------------------------------------------
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFib = memoize(fibonacci);
console.log(memoizedFib(30)); // calculated once and cached

/*
  TIME COMPLEXITY: makes REPEATED calls with the same arguments O(1)
  instead of recalculating - big win for expensive, pure functions
  (functions that always return the same output for the same input).
  SPACE COMPLEXITY: O(k) - where k is the number of unique argument
  combinations seen so far.
*/
