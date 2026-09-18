# Promises

## Explanation
A Promise is an object representing the eventual result of an asynchronous operation. It's JavaScript's modern replacement for deeply nested callbacks.

A Promise is always in one of three states:
- **Pending** — still working, not resolved yet
- **Fulfilled** — completed successfully (has a result value)
- **Rejected** — failed (has an error/reason)

You attach handlers with `.then()` (success), `.catch()` (failure), and `.finally()` (runs regardless).

## Examples
```js
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: "Alex" }); // success
      } else {
        reject(new Error("Invalid id")); // failure
      }
    }, 1000);
  });
}

fetchUser(1)
  .then(user => {
    console.log(user); // { id: 1, name: "Alex" }
    return user.name;
  })
  .then(name => console.log(name)) // "Alex" — chaining
  .catch(err => console.error(err.message))
  .finally(() => console.log("Done"));
```

### Chaining vs callback hell
```js
// Instead of nested callbacks, promises chain flatly:
getUser(id)
  .then(user => getPosts(user.id))
  .then(posts => getComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(err => console.error("Something failed:", err));
```

## Why it matters
Promises are the backbone of modern async JS — `fetch()`, file operations, timers-as-promises, and `async/await` are all built on them. Understanding Promises is essential before async/await will make full sense.

## Questions
1. What are the three states a Promise can be in?
2. What's the difference between `.then()` and `.catch()`?
3. Why is chaining `.then()` calls better than nesting callbacks inside each other?
4. Predict what happens if `reject()` is called inside a Promise executor and there's no `.catch()` attached.
5. Write a Promise-based function `wait(ms)` that resolves after `ms` milliseconds (hint: use `setTimeout` inside `new Promise`).
