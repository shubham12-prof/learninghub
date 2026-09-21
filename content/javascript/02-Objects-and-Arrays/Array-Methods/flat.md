# flat — flattens nested arrays

```js
[1, [2, [3, [4]]]].flat(); // [1,2,[3,[4]]] (depth 1)
[1, [2, [3, [4]]]].flat(2); // [1,2,3,[4]]
[1, [2, [3, [4]]]].flat(Infinity); // [1,2,3,4]

// flatMap = map + flat(1)
[1, 2, 3].flatMap((n) => [n, n * 2]); // [1,2,2,4,3,6]
```
