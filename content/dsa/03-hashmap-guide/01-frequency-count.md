# Frequency Count

Using a hash map (JS `Object` or `Map`) to count how many times each element appears — one of the most common building blocks in problem solving.

```javascript
function getFrequency(arr) {
  const freq = new Map();

  for (const item of arr) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }

  return freq;
}

const arr = ["a", "b", "a", "c", "b", "a"];
console.log(getFrequency(arr));
// Map(3) { 'a' => 3, 'b' => 2, 'c' => 1 }
```

## Finding the most frequent element

```javascript
function mostFrequent(arr) {
  const freq = getFrequency(arr);
  let maxItem = null;
  let maxCount = 0;

  for (const [item, count] of freq) {
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }

  return maxItem;
}

console.log(mostFrequent(["a", "b", "a", "c", "b", "a"])); // "a"
```

## Finding duplicates

```javascript
function findDuplicates(arr) {
  const freq = getFrequency(arr);
  return [...freq.entries()]
    .filter(([, count]) => count > 1)
    .map(([item]) => item);
}

console.log(findDuplicates([1, 2, 3, 2, 4, 1])); // [1, 2]
```

## Complexity

O(n) time to build the frequency map, O(n) space.

## Where it shows up

Anagram checks, "first non-repeating character," majority element, top-K frequent elements.
