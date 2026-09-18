# Debounce

## Explanation
Debouncing delays running a function until a certain amount of time has passed *since the last time it was called*. If the function is triggered again before that time is up, the timer resets.

Think: a search box that fires an API call — you don't want to call the API on every single keystroke, only after the user *stops typing* for a bit.

## Examples
```js
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId); // cancel the previous pending call
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function searchAPI(query) {
  console.log("Searching for:", query);
}

const debouncedSearch = debounce(searchAPI, 500);

// Simulating fast typing: "h", "he", "hel", "hell", "hello"
input.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});
// Only ONE API call fires — 500ms after the user stops typing
```

## Why it matters
Debouncing prevents wasteful, excessive function calls — especially important for expensive operations like API calls, search-as-you-type, window resize handlers, or form validation. It's a very common real-world interview question ("implement debounce from scratch").

## Questions
1. In your own words, what does debouncing do?
2. Why does `clearTimeout` matter inside the debounce implementation?
3. Give two real-world UI scenarios where debouncing improves performance or user experience.
4. If a user types 5 characters quickly with a 300ms debounce delay, how many times does the debounced function actually run?
5. What would go wrong (in terms of user experience or performance) if you did NOT debounce a search-as-you-type input?
