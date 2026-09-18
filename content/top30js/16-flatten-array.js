/*
  Top 30 - #16: Flatten Array

  PROBLEM: flatten an array nested to any depth into a single flat array.
  Example: [1, [2, [3, [4, 5]], 6]] -> [1, 2, 3, 4, 5, 6]
*/

function flatten(arr) {
  let result = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      result = result.concat(flatten(item)); // recurse into nested arrays
    } else {
      result.push(item);
    }
  }

  return result;
}

console.log(flatten([1, [2, [3, [4, 5]], 6]])); // [1, 2, 3, 4, 5, 6]

// Built-in alternative: arr.flat(Infinity) flattens all levels.
console.log([1, [2, [3, 4]], 5].flat(Infinity)); // [1, 2, 3, 4, 5]

/*
  TIME COMPLEXITY: O(n) - n = total number of elements across all
  nesting levels.
*/
