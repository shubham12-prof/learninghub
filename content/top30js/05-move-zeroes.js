/*
  Top 30 - #5: Move Zeroes

  PROBLEM: move all 0s to the end of the array, keeping the relative
  order of non-zero elements, done IN-PLACE.
  Example: [0,1,0,3,12] -> [1,3,12,0,0]

  WHY TWO POINTERS FIT: "slow" marks where the next non-zero value
  should go. "fast" scans for non-zero values and swaps them into place.
*/

function moveZeroes(nums) {
  let slow = 0;

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }

  return nums;
}

console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(1) - done entirely in-place via swapping.
*/
