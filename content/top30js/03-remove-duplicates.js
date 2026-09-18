/*
  Top 30 - #3: Remove Duplicates

  PROBLEM: remove duplicate values from an array.
  Example: [1, 2, 2, 3, 4, 4, 4, 5] -> [1, 2, 3, 4, 5]
*/

// Easiest way: a Set can only hold unique values.
function removeDuplicates(arr) {
  return [...new Set(arr)];
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 4, 5])); // [1, 2, 3, 4, 5]


// -----------------------------------------------------------------
// If the array is already SORTED and you need to do it IN-PLACE
// (common follow-up, e.g. LeetCode's "Remove Duplicates from Sorted
// Array") - uses the two-pointer technique.
// -----------------------------------------------------------------
function removeDuplicatesSortedInPlace(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // marks the last confirmed-unique position

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  return slow + 1; // new length
}

const sortedArr = [1, 1, 2, 2, 3];
const newLength = removeDuplicatesSortedInPlace(sortedArr);
console.log(newLength, sortedArr.slice(0, newLength)); // 3 [1, 2, 3]

/*
  TIME COMPLEXITY: O(n) for both versions.
  SPACE COMPLEXITY: Set version is O(n) extra space. In-place two
  pointer version is O(1) extra space, but requires a SORTED array.
*/
