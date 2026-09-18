/*
  Top 30 - #11: Debounce

  PROBLEM: delay running a callback until the user STOPS calling it
  for a set amount of time. Every new call RESETS the timer. Classic
  use: search-as-you-type, only fire the API call once typing pauses.
*/

function debounce(fn, delay) {
  let timeoutId;

  return function (...args) {
    const context = this;
    clearTimeout(timeoutId); // cancel the previous pending call
    timeoutId = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
function search(query) {
  console.log("Searching:", query);
}

const debouncedSearch = debounce(search, 300);
debouncedSearch("h");
debouncedSearch("he");
debouncedSearch("hello");
// Only logs "Searching: hello" - once, after 300ms of no more calls.

/*
  DEBOUNCE vs THROTTLE: debounce waits for a PAUSE, then runs once.
  Throttle runs at a steady, LIMITED rate no matter how often called.
*/
