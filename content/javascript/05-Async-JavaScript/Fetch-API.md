# Fetch API

```js
async function getData() {
  const response = await fetch("https://api.example.com/data");
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data = await response.json();
  return data;
}

// POST request
fetch("https://api.example.com/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice" }),
});
```

**Interview note:** `fetch` only rejects on network failure — a 404 or 500 response is still a "successful" fetch and won't throw automatically; you must check `response.ok`.
