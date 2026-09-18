/*
  Top 30 - #23: Event Loop Output (predict-the-output practice)

  GOLDEN RULE: run ALL sync code first -> then empty the ENTIRE
  microtask queue (Promise.then, async/await) -> then run ONE
  macrotask (setTimeout) -> empty microtasks again -> repeat.
*/

console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");

/*
  EXPECTED OUTPUT: 1, 4, 3, 2
  WHY: sync code (1, 4) runs first, then the microtask (3), then the
  macrotask (2) - even though the timer delay is 0ms.
*/


// -----------------------------------------------------------------
// A slightly trickier version with chained .then()
// -----------------------------------------------------------------
console.log("--- next example ---");

setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => console.log("promise 1"))
  .then(() => console.log("promise 2"));

console.log("sync");

/*
  EXPECTED OUTPUT: sync, promise 1, promise 2, timeout
  WHY: BOTH chained .then() calls are microtasks and run before ANY
  macrotask, even though there are two of them.
*/
