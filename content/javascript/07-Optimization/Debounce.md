# Debounce

Delays executing a function until after a period of inactivity — useful for search inputs, resize handlers. If called again before the delay ends, the timer resets.

```js
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const handleSearch = debounce((query) => {
  console.log("Searching for:", query);
}, 300);

input.addEventListener("input", (e) => handleSearch(e.target.value));
// Only fires 300ms after the user STOPS typing
```
