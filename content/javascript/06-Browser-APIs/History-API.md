# History API

Manipulate the browser's session history without full page reloads (used heavily in SPA routing).

```js
history.pushState({ page: 1 }, "", "/page1"); // adds a new entry, updates URL
history.replaceState({ page: 1 }, "", "/page1"); // replaces current entry
history.back();
history.forward();
history.go(-2);

window.addEventListener("popstate", (e) => {
  console.log("Navigated via back/forward:", e.state);
});
```
