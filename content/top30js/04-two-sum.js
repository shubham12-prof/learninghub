/*
  Top 30 - #4: Two Sum

  PROBLEM: given an array and a target, return the indices of two
  numbers that add up to the target.
  Example: [2,7,11,15], target=9 -> [0,1]  (2+7=9)

  WHY A HASHMAP FITS: instead of checking every pair (O(n^2)), we walk
  through once and ask "have I already seen the number that completes
  THIS pair?" - a hashmap answers that in O(1).
*/

function twoSum(nums, target) {
  const seen = {}; // { number: indexWhereSeen }

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (complement in seen) {
      return [seen[complement], i];
    }

    seen[nums[i]] = i;
  }

  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));      // [1, 2]

/*
  TIME COMPLEXITY: O(n) - single pass.
  SPACE COMPLEXITY: O(n) - worst case, stores every number seen so far.
*/
