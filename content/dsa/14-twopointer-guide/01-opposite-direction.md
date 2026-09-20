# Opposite Direction (Two Pointer)

Two pointers start at opposite ends of the array (or string) and move toward each other, narrowing the search space by one element from whichever side doesn't help.

## Two Sum on a Sorted Array

```javascript
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++; // need a bigger sum -> move left pointer up
    } else {
      right--; // need a smaller sum -> move right pointer down
    }
  }

  return [];
}

console.log(twoSumSorted([1, 2, 4, 6, 10], 8)); // [1, 3] -> 2 + 6
```

## Valid Palindrome

```javascript
function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++;
    right--;
  }

  return true;
}
```

## Container With Most Water

```javascript
function maxArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const height = Math.min(heights[left], heights[right]);
    maxWater = Math.max(maxWater, width * height);

    // move the shorter wall inward — it's the limiting factor
    if (heights[left] < heights[right]) left++;
    else right--;
  }

  return maxWater;
}

console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
```

## 3Sum — find all unique triplets that sum to 0

```javascript
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue; // skip duplicates

    let left = i + 1,
      right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++; // skip duplicates
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```

## Complexity

O(n) time for a single opposite-direction pass (or O(n log n) if sorting is required first), O(1) extra space.

## Recognize this pattern when...

The array is sorted (or can be sorted) and the problem involves pairs/triplets summing to a target, palindrome checks, or maximizing/minimizing something between two boundaries.
