# async / await

## Explanation
`async/await` is syntax sugar built on top of Promises that lets asynchronous code *look* synchronous, making it much easier to read.

- Marking a function `async` makes it automatically return a Promise.
- `await` pauses execution *inside that function* until the Promise resolves, then gives you the resolved value directly (no `.then()` needed).
- Errors are handled with regular `try/catch` instead of `.catch()`.

## Examples
```js
// Promise-based version
function getUserData(id) {
  return fetchUser(id)
    .then(user => fetchPosts(user.id))
    .then(posts => posts[0]);
}

// async/await version — same logic, easier to read
async function getUserData(id) {
  const user = await fetchUser(id);
  const posts = await fetchPosts(user.id);
  return posts[0];
}
```

### Error handling
```js
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    console.log(user);
  } catch (err) {
    console.error("Failed to load user:", err.message);
  } finally {
    console.log("Request finished");
  }
}
```

### Common mistake: sequential when you meant parallel
```js
// Slow — waits for each one before starting the next
async function slow() {
  const a = await fetchA(); // waits
  const b = await fetchB(); // then waits again
}

// Fast — starts both at once
async function fast() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
}
```

## Why it matters
Almost all real-world async JS today (API calls, database calls, file reads) is written with async/await because it avoids `.then()` chains and reads top-to-bottom like normal code. It's essential for working with any API in modern JS.

## Questions
1. What does marking a function `async` change about its return value?
2. What does `await` actually do, step by step?
3. How do you handle errors in an `async` function, and how does that differ from Promise `.catch()`?
4. Why is the "fast" example above faster than the "slow" one, even though both use `await`?
5. Predict the output order:
```js
console.log("1");
async function foo() {
  console.log("2");
  await null;
  console.log("3");
}
foo();
console.log("4");
```
