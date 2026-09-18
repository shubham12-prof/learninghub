/*
  Top 30 - #6: Rotate Array

  PROBLEM: rotate an array to the RIGHT by k steps.
  Example: [1,2,3,4,5,6,7], k=3 -> [5,6,7,1,2,3,4]

  EASIEST APPROACH: use array slicing - take the last k elements and
  put them in front of the rest.
*/

function rotate(nums, k) {
  const n = nums.length;
  // k can be bigger than n (e.g. rotating by 10 on a 7-item array is
  // the same as rotating by 3) - modulo handles that safely.
  k = k % n;

  const lastK = nums.slice(n - k);      // the last k elements
  const rest = nums.slice(0, n - k);    // everything else

  return [...lastK, ...rest];
}

console.log(rotate([1, 2, 3, 4, 5, 6, 7], 3)); // [5, 6, 7, 1, 2, 3, 4]


// -----------------------------------------------------------------
// IN-PLACE version using the "reverse three times" trick (common
// follow-up: "can you do it without extra array space?")
// -----------------------------------------------------------------
function reverseRange(nums, start, end) {
  while (start < end) {
    [nums[start], nums[end]] = [nums[end], nums[start]];
    start++;
    end--;
  }
}

function rotateInPlace(nums, k) {
  const n = nums.length;
  k = k % n;

  reverseRange(nums, 0, n - 1);     // reverse the WHOLE array
  reverseRange(nums, 0, k - 1);     // reverse the first k elements
  reverseRange(nums, k, n - 1);     // reverse the rest

  return nums;
}

console.log(rotateInPlace([1, 2, 3, 4, 5, 6, 7], 3)); // [5, 6, 7, 1, 2, 3, 4]

/*
  WHY "REVERSE 3 TIMES" WORKS - walkthrough for [1,2,3,4,5,6,7], k=3:
  1. Reverse whole array: [7,6,5,4,3,2,1]
  2. Reverse first k=3:   [5,6,7,4,3,2,1]
  3. Reverse the rest:    [5,6,7,1,2,3,4]  ✅ matches expected output

  TIME COMPLEXITY: O(n) for both versions.
  SPACE COMPLEXITY: slice version is O(n) extra space. In-place
  version is O(1) extra space.
*/
