/*
  Top 30 - #9: Product of Array Except Self

  PROBLEM: given an array, return a new array where each element is
  the PRODUCT of all other elements EXCEPT itself - WITHOUT using
  division, in O(n) time.
  Example: [1,2,3,4] -> [24,12,8,6]
  (index 0: 2*3*4=24, index 1: 1*3*4=12, index 2: 1*2*4=8, index 3: 1*2*3=6)

  WHY THIS APPROACH WORKS: for each index i, the answer is
  (product of everything to its LEFT) * (product of everything to its
  RIGHT). We calculate these in two passes: one going left-to-right
  building up left-products, one going right-to-left building up
  right-products - avoiding division entirely.
*/

function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // PASS 1: fill result[i] with the product of everything to the LEFT of i.
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    result[i] = leftProduct;
    leftProduct *= nums[i]; // update for the NEXT index
  }

  // PASS 2: multiply result[i] by the product of everything to the
  // RIGHT of i (going backward this time).
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i]; // update for the NEXT (previous) index
  }

  return result;
}

console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]
console.log(productExceptSelf([-1, 1, 0, -3, 3])); // [0, 0, 9, 0, 0]

/*
  WALKTHROUGH for [1,2,3,4]:
  PASS 1 (left products):
    i=0: result[0]=1 (nothing to the left). leftProduct becomes 1*1=1.
    i=1: result[1]=1. leftProduct becomes 1*2=2.
    i=2: result[2]=2. leftProduct becomes 2*3=6.
    i=3: result[3]=6. leftProduct becomes 6*4=24.
    result so far: [1, 1, 2, 6]

  PASS 2 (right products, going backward):
    i=3: result[3] *= 1 (nothing to the right) -> result[3]=6. rightProduct=1*4=4.
    i=2: result[2] *= 4 -> result[2]=2*4=8. rightProduct=4*3=12.
    i=1: result[1] *= 12 -> result[1]=1*12=12. rightProduct=12*2=24.
    i=0: result[0] *= 24 -> result[0]=1*24=24. rightProduct=24*1=24.
    Final: [24, 12, 8, 6] ✅

  TIME COMPLEXITY: O(n) - two simple passes.
  SPACE COMPLEXITY: O(1) extra (not counting the output array itself,
  which the problem requires anyway).
*/
