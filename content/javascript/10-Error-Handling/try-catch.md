# try...catch

Catches runtime errors so they don't crash the program.

```js
try {
  const data = JSON.parse("{invalid json}");
} catch (error) {
  console.error("Parsing failed:", error.message);
} finally {
  console.log("This always runs — cleanup code goes here");
}

// Optional catch binding (ES2019+) — you can omit the error variable
try {
  riskyOperation();
} catch {
  console.log("Something went wrong");
}
```

`try...catch` only catches **synchronous** errors within its block. It does NOT catch errors inside `setTimeout` or unhandled promise rejections unless you `await` them inside the try block.

```js
try {
  setTimeout(() => {
    throw new Error("boom");
  }, 0);
} catch (e) {
  // never runs — the error happens in a later macrotask, outside this try block
}

// Correct way with async code:
async function run() {
  try {
    await someAsyncFn(); // errors from the awaited promise ARE caught here
  } catch (e) {
    console.error("Caught:", e.message);
  }
}
```
