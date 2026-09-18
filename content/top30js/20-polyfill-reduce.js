/*
  Top 30 - #20: Polyfill for reduce()

  PROBLEM: implement your own Array.prototype.reduce() - boils an
  array down to a single value by repeatedly combining an accumulator
  with each element.
*/

Array.prototype.myReduce = function (callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  // No initial value given -> use the first element as the starting
  // accumulator, and start the loop from index 1 instead of 0.
  if (accumulator === undefined) {
    if (this.length === 0) {
      throw new TypeError("Reduce of empty array with no initial value");
    }
    accumulator = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    accumulator = callback(accumulator, this[i], i, this);
  }

  return accumulator;
};

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const nums = [1, 2, 3, 4];
console.log(nums.myReduce((acc, n) => acc + n, 0)); // 10

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(1) extra (not counting the accumulator's own size)
*/
