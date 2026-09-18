/*
  Top 30 - #19: Polyfill for filter()

  PROBLEM: implement your own Array.prototype.filter() - returns a NEW
  array with only the elements for which the callback returns truthy.
*/

Array.prototype.myFilter = function (callback) {
  const result = [];

  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }

  return result;
};

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const nums = [1, 2, 3, 4, 5, 6];
console.log(nums.myFilter((n) => n % 2 === 0)); // [2, 4, 6]

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(k) - k = number of items that pass the test.
*/
