# Default Parameters

```js
function greet(name = "Guest", greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
greet(); // "Hello, Guest!"
greet("Bob"); // "Hello, Bob!"
greet("Bob", "Hi"); // "Hi, Bob!"

// Defaults can reference earlier parameters
function createUser(name, id = name.toLowerCase()) {}
```
