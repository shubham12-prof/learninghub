# Lazy Loading

Deferring loading of resources/code until they're actually needed, reducing initial load time.

```js
// Dynamic import — loads the module only when this code runs
button.addEventListener("click", async () => {
  const { heavyFeature } = await import("./heavyFeature.js");
  heavyFeature();
});

// Lazy loading images
<img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy" />;

// React example
const Dashboard = React.lazy(() => import("./Dashboard"));
```

Native `loading="lazy"` on `<img>`/`<iframe>` defers offscreen images until they're near the viewport.
