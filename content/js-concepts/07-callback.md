# Callback Functions

## Explanation
A callback is simply a function passed as an argument to another function, to be run later — either immediately after some logic, or after an async operation finishes (like a timer, file read, or network request).

Callbacks are how JavaScript handled asynchronous work before Promises existed, and they're still used everywhere (event listeners, array methods, timers).

## Examples
```js
// Synchronous callback
function processArray(arr, callback) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i]);
  }
}
processArray([1, 2, 3], (num) => console.log(num * 2)); // 2, 4, 6

// Asynchronous callback
setTimeout(() => {
  console.log("This runs after 2 seconds");
}, 2000);

// Event listener callback
button.addEventListener("click", () => {
  console.log("Button was clicked");
});
```

### Callback hell
When callbacks are nested inside callbacks (common with sequential async steps), code becomes hard to read:
```js
getUser(id, (user) => {
  getPosts(user.id, (posts) => {
    getComments(posts[0].id, (comments) => {
      console.log(comments); // deeply nested, hard to follow
    });
  });
});
```
This is exactly the problem Promises and `async/await` were designed to solve.

## Why it matters
Callbacks are foundational — understanding them makes Promises and async/await feel like natural upgrades rather than magic. Array methods like `map`, `filter`, `forEach` are also built entirely around passing callbacks.

## Questions
1. What is a callback function, in your own words?
2. Give an example of a callback being used synchronously vs. asynchronously.
3. What is "callback hell" and why does it make code harder to maintain?
4. Predict the output order:
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
```
5. How do Promises attempt to solve the callback hell problem (in general terms)?
