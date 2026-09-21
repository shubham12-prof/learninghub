# Async/Await

Syntactic sugar over promises — makes async code read like synchronous code.

```js
async function getUserPosts(id) {
  try {
    const user = await fetchUser(id); // pauses here until promise settles
    const posts = await fetchPosts(user.id);
    return posts;
  } catch (err) {
    console.error("Failed:", err);
  }
}
```

An `async` function always returns a Promise. `await` can only be used inside an `async` function (or at the top level of modules).

```js
// Parallel execution with async/await
async function getBoth() {
  const [user, posts] = await Promise.all([fetchUser(1), fetchPosts(1)]);
  // runs concurrently, not sequentially
}
```

**Common mistake:** awaiting sequentially when things could run in parallel.

```js
// ❌ slow — sequential
const a = await taskA();
const b = await taskB();

// ✅ fast — parallel
const [a, b] = await Promise.all([taskA(), taskB()]);
```
