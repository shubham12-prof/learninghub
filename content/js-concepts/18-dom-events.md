# DOM Events

## Explanation
DOM events are how JavaScript responds to things happening in the browser — clicks, key presses, form submissions, page loads, mouse movement, etc. You "listen" for an event using `addEventListener`.

Key concepts:
- **`addEventListener(event, handler)`** — attaches a function to run when the event fires.
- **Event object** — automatically passed to your handler, contains info about the event (which key, which element, mouse position, etc.).
- **`event.preventDefault()`** — stops the browser's default behavior (e.g., stop a form from actually submitting/reloading the page).
- **Event bubbling** — events fire on the target element first, then "bubble up" through its parent elements.
- **Event delegation** — attaching one listener to a parent element instead of many listeners to individual children, using bubbling to detect which child was interacted with.

## Examples
```js
const button = document.querySelector("#myButton");

button.addEventListener("click", (event) => {
  console.log("Button clicked!", event.target);
});

// Preventing default behavior (e.g. form submission reload)
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("Form submitted without reloading the page");
});

// Event delegation: one listener handles clicks on ANY <li>,
// even ones added to the DOM later
const list = document.querySelector("#myList");
list.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    console.log("Clicked item:", event.target.textContent);
  }
});
```

## Why it matters
Nearly all interactivity on a webpage — buttons, forms, menus, drag-and-drop — is built on DOM events. Event delegation in particular is a key performance/scaling pattern used in real apps with dynamic lists.

## Questions
1. What's the purpose of `event.preventDefault()`? Give an example of when you'd use it.
2. What is "event bubbling" and how does it enable event delegation?
3. Why is event delegation often more efficient than attaching a listener to every single list item?
4. Write the code to log a message every time any key is pressed on the page.
5. If you click a `<button>` inside a `<div>` that both have click listeners, in what order do the handlers fire (by default)?
