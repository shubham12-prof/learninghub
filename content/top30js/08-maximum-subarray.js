/*
  Top 30 - #8: Maximum Subarray (Kadane's Algorithm)

  PROBLEM: find the contiguous subarray (containing at least one
  number) with the LARGEST sum, and return that sum. Unlike the
  "Maximum Sum Subarray of size K" problem, the subarray length here
  is NOT fixed - it can be ANY length.
  Example: [-2,1,-3,4,-1,2,1,-5,4] -> 6   (subarray [4,-1,2,1])

  WHY THIS APPROACH (KADANE'S ALGORITHM) WORKS: at each position, we
  decide: should I EXTEND the current subarray by including this
  number, or is the current subarray so "negative" that it's better to
  just START FRESH from this number? If the running sum ever drops
  below the current number itself, restarting is always better.
*/

function maxSubArray(nums) {
  let currentSum = nums[0]; // running sum of the "best subarray ending HERE"
  let maxSum = nums[0];     // best sum found so far, anywhere

  for (let i = 1; i < nums.length; i++) {
    // Either extend the previous subarray, or start fresh at nums[i] -
    // whichever gives a bigger sum.
    currentSum = Math.max(nums[i], currentSum + nums[i]);

    // Track the overall best, across all positions.
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6
console.log(maxSubArray([1]));                              // 1
console.log(maxSubArray([-1, -2, -3]));                     // -1 (best is just the single least-negative number)

/*
  WALKTHROUGH for [-2,1,-3,4,-1,2,1,-5,4]:
  i=0: currentSum=-2, maxSum=-2
  i=1 (1): currentSum=max(1, -2+1=-1)=1. maxSum=max(-2,1)=1.
  i=2 (-3): currentSum=max(-3, 1-3=-2)=-2. maxSum stays 1.
  i=3 (4): currentSum=max(4, -2+4=2)=4. maxSum=max(1,4)=4.
  i=4 (-1): currentSum=max(-1, 4-1=3)=3. maxSum stays 4.
  i=5 (2): currentSum=max(2, 3+2=5)=5. maxSum=max(4,5)=5.
  i=6 (1): currentSum=max(1, 5+1=6)=6. maxSum=max(5,6)=6.
  i=7 (-5): currentSum=max(-5, 6-5=1)=1. maxSum stays 6.
  i=8 (4): currentSum=max(4, 1+4=5)=5. maxSum stays 6.
  Final answer: 6 ✅ (matches subarray [4,-1,2,1] = 6)

  TIME COMPLEXITY: O(n) - single pass.
  SPACE COMPLEXITY: O(1)
*/
