# Lookup

The core superpower of a hash map: checking "have I seen this before?" or "does this key exist?" in O(1) average time, instead of O(n) with a linear scan.

## Object vs Map for lookups

```javascript
// Using Map (preferred for dynamic keys — safer, has real .size, any key type)
const seen = new Map();
seen.set("apple", true);
console.log(seen.has("apple")); // true
console.log(seen.has("banana")); // false

// Using Object (fine for string keys, simple cases)
const seenObj = {};
seenObj["apple"] = true;
console.log("apple" in seenObj); // true
console.log(seenObj.hasOwnProperty("banana")); // false
```

## Example — detecting duplicates in O(n) instead of O(n²)

```javascript
function hasDuplicate(arr) {
  const seen = new Set(); // Set is a hash-based lookup structure too

  for (const item of arr) {
    if (seen.has(item)) return true;
    seen.add(item);
  }

  return false;
}

console.log(hasDuplicate([1, 2, 3, 4, 2])); // true
```

## Example — Two Sum using lookup (see Arrays guide for full explanation)

```javascript
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }

  return [];
}
```

## Complexity

O(1) average time per lookup/insert, O(n) space for the structure.

## Why "average" and not "always"?

Hash collisions can degrade individual operations to O(n) in the worst case, but JS engines handle this well in practice — for interview purposes, treat hash map lookups as O(1).
