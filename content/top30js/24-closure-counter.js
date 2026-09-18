/*
  Top 30 - #24: Closure Counter

  PROBLEM: build a counter function that remembers its count between
  calls, WITHOUT using a global variable - a classic closure demo.
*/

function createCounter() {
  let count = 0; // "enclosed" by the returned function - private state

  return function () {
    count++;
    return count;
  };
}

const counter1 = createCounter();
console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter1()); // 3

// A separate call to createCounter() makes a totally independent count.
const counter2 = createCounter();
console.log(counter2()); // 1 - fresh counter, unaffected by counter1


// -----------------------------------------------------------------
// Bonus: a counter with increment/decrement/reset (common follow-up)
// -----------------------------------------------------------------
function createAdvancedCounter() {
  let count = 0;

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    reset() {
      count = 0;
      return count;
    },
    getValue() {
      return count;
    },
  };
}

const counter = createAdvancedCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.reset());     // 0

/*
  WHY THIS IS A CLOSURE: the returned function(s) keep access to
  "count" even after createCounter()/createAdvancedCounter() has
  already finished running - that's the defining trait of a closure.
*/
