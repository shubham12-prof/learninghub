# Loops

```js
for (let i = 0; i < 5; i++) {}

let i = 0;
while (i < 5) {
  i++;
}

let j = 0;
do {
  j++;
} while (j < 5);

for (const key in { a: 1, b: 2 }) {
} // iterates over keys (objects)
for (const val of [10, 20, 30]) {
} // iterates over values (iterables)

// break / continue
for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // skip
  if (i === 6) break; // stop
}
```

`for...in` iterates enumerable property **keys** (including inherited ones) — best for objects.
`for...of` iterates over **iterable values** (arrays, strings, maps, sets) — best for arrays.
