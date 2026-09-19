# Routing

The general concept of mapping URL paths to different UI views in a Single Page Application (SPA) — since a SPA loads a single HTML page, routing is handled entirely on the client with JavaScript (no full page reload per navigation).

**Core ideas any client-side router implements:**

- Matching the current URL path to a component to render
- Updating the URL (via the History API) without a full page reload when navigating
- Supporting dynamic segments (`/users/:id`), nested routes, and query parameters
- Handling browser back/forward buttons correctly (`popstate` events)

```js
// A minimal illustration of what a router does internally, using the History API
function navigate(path) {
  history.pushState({}, "", path);
  renderRouteFor(path);
}

window.addEventListener("popstate", () => {
  renderRouteFor(location.pathname); // handle back/forward button
});
```

In practice, React apps use a dedicated library — **React Router** is the dominant choice (see its own file) — rather than hand-rolling this logic.

**Interview note:** "Why can't you just use `<a href>` for SPA navigation?" — a plain anchor tag triggers a full page reload, re-downloading and re-parsing the entire app; client-side routers intercept the click, update the URL via the History API, and re-render only the necessary components, keeping app state intact.
