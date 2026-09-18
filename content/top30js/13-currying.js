/*
  Top 30 - #13: Currying

  PROBLEM: transform a function that takes MULTIPLE arguments into a
  sequence of functions that each take ONE argument (or a few), where
  calling with all needed args finally produces the result.
  Example: curry(add)(1)(2)(3) === 6, if add(a,b,c) = a+b+c
*/

function curry(fn) {
  return function curried(...args) {
    // If we already have enough arguments to call the original
    // function, just call it now.
    if (args.length >= fn.length) {
      // fn.length tells us how many parameters the ORIGINAL function expects.
      return fn.apply(this, args);
    }

    // Otherwise, return a NEW function that collects MORE arguments,
    // combining them with what we already have.
    return function (...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));   // 6 - one argument at a time
console.log(curriedAdd(1, 2)(3));   // 6 - some grouped, some separate
console.log(curriedAdd(1, 2, 3));   // 6 - all at once, still works

/*
  WHY CURRYING IS USEFUL: it lets you create specialized, reusable
  functions by "pre-filling" some arguments.
*/
const add5 = curriedAdd(5); // "locks in" the first argument as 5
console.log(add5(10, 20)); // 35  (5 + 10 + 20)
console.log(add5(1)(1));   // 7   (5 + 1 + 1)

/*
  TIME COMPLEXITY: O(1) per call (ignoring the underlying fn's own cost)
*/
