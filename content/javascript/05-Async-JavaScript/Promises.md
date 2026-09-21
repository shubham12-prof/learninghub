# Promises

Represents the eventual result of an async operation. Three states: `pending`, `fulfilled`, `rejected` (once settled, it can't change state again).

```js
const promise = new Promise((resolve, reject) => {
  const success = true;
  setTimeout(() => {
    success ? resolve("Data loaded") : reject("Error loading data");
  }, 1000);
});

promise
  .then((result) => console.log(result))
  .catch((err) => console.error(err))
  .finally(() => console.log("Done, success or not"));
```

Chaining:

```js
fetchUser(1)
  .then((user) => fetchPosts(user.id))
  .then((posts) => console.log(posts))
  .catch((err) => console.error("Something failed:", err));
```
