# LocalStorage

Persists data with **no expiration**, scoped per origin (protocol + domain + port), ~5-10MB limit. Data survives browser restarts. Synchronous API; stores strings only.

```js
localStorage.setItem("theme", "dark");
localStorage.getItem("theme"); // "dark"
localStorage.removeItem("theme");
localStorage.clear();

// Storing objects
localStorage.setItem("user", JSON.stringify({ name: "Alice" }));
const user = JSON.parse(localStorage.getItem("user"));
```
