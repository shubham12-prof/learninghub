/*
  Top 30 - #18: Polyfill for map()

  PROBLEM: implement your own Array.prototype.map() - transforms every
  element with a callback, returns a NEW array of the results.
*/

Array.prototype.myMap = function (callback) {
  const result = [];

  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this)); // (element, index, array)
  }

  return result;
};

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const nums = [1, 2, 3, 4];
console.log(nums.myMap((n) => n * 2)); // [2, 4, 6, 8]
console.log(nums);                     // [1, 2, 3, 4]  -> original unchanged

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(n) - a new array is returned.
*/
