# Rest Operator

Collects remaining arguments into an array.

```js
function sum(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4); // 10

function logFirst(first, ...rest) {
  console.log(first, rest);
}
logFirst(1, 2, 3); // 1 [2, 3]
```
