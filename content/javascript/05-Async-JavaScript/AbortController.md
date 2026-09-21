# AbortController

Used to cancel an ongoing fetch request (or other abortable operations).

```js
const controller = new AbortController();
const { signal } = controller;

fetch("https://api.example.com/data", { signal })
  .then((res) => res.json())
  .catch((err) => {
    if (err.name === "AbortError") console.log("Fetch was cancelled");
  });

// Cancel after 3 seconds
setTimeout(() => controller.abort(), 3000);
```
