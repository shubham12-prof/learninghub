# Destructuring

## Explanation
Destructuring lets you "unpack" values from arrays or properties from objects into individual variables, in one concise line, instead of accessing them one by one.

## Examples

### Array destructuring
```js
const colors = ["red", "green", "blue"];
const [first, second] = colors;
console.log(first, second); // "red" "green"

// skipping elements
const [, , third] = colors;
console.log(third); // "blue"

// swapping variables
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1
```

### Object destructuring
```js
const user = { name: "Riya", age: 28, city: "Delhi" };
const { name, age } = user;
console.log(name, age); // "Riya" 28

// renaming while destructuring
const { name: userName } = user;
console.log(userName); // "Riya"

// default values
const { country = "India" } = user;
console.log(country); // "India" (not in the object, so default used)
```

### In function parameters (very common!)
```js
function greet({ name, age }) {
  console.log(`${name} is ${age} years old`);
}
greet(user); // "Riya is 28 years old"
```

## Why it matters
Destructuring makes code shorter and more readable, especially when working with objects returned from APIs, or extracting props in React. It's used everywhere in modern JS.

## Questions
1. What's the difference in syntax between destructuring an array vs. an object?
2. How do you provide a default value while destructuring an object property that might not exist?
3. How would you destructure a function's object parameter directly in the parameter list?
4. Given `const point = { x: 10, y: 20 };`, write one line to extract `x` and `y` into variables.
5. What's a real scenario where destructuring makes code noticeably cleaner than not using it?
