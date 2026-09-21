# Destructuring

Extract values from arrays/objects into distinct variables.

```js
// Array destructuring
const [first, second, , fourth] = [1, 2, 3, 4];
const [a, b, ...rest] = [1, 2, 3, 4]; // rest -> [3,4]

// Swap without a temp variable
let x = 1,
  y = 2;
[x, y] = [y, x];

// Object destructuring
const { name, age } = person;
const { name: fullName } = person; // rename
const { city = "Unknown" } = person; // default value

// Nested destructuring
const {
  address: { pincode },
} = { address: { pincode: 110001 } };

// In function parameters
function printUser({ name, age }) {
  console.log(name, age);
}
```
