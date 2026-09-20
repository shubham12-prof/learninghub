# Rotation

Rotating an array shifts elements left or right by `k` positions.

## Brute force (extra array)

```javascript
function rotateRight(arr, k) {
  const n = arr.length;
  k = k % n;
  return [...arr.slice(n - k), ...arr.slice(0, n - k)];
}

console.log(rotateRight([1, 2, 3, 4, 5], 2)); // [4, 5, 1, 2, 3]
```

## In-place with the "reversal algorithm" (O(1) extra space)

Reverse the whole array, then reverse each part separately.

```javascript
function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}

function rotateInPlace(arr, k) {
  const n = arr.length;
  k = k % n;
  reverse(arr, 0, n - 1);
  reverse(arr, 0, k - 1);
  reverse(arr, k, n - 1);
  return arr;
}

console.log(rotateInPlace([1, 2, 3, 4, 5], 2)); // [4, 5, 1, 2, 3]
```

## Complexity

Brute force: O(n) time / O(n) space.
Reversal trick: O(n) time / O(1) space.
