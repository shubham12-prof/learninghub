# Quick Interview Q&A

**Q: Give a real-world example each for debounce and throttle.**
Debounce: a search-as-you-type box that waits until the user pauses before firing an API call. Throttle: an infinite-scroll page that checks scroll position at most every 200ms to decide whether to load more content.

**Q: What's the tradeoff of memoization?**
Trades memory for speed — the cache grows with unique inputs, so it's best for pure functions with a limited/repeating set of inputs.

**Q: Why doesn't tree shaking work well with CommonJS?**
`require()` calls can be dynamic and conditional, so bundlers can't statically determine at build time what's actually used — ESM's static `import`/`export` structure can be analyzed without running the code.

**Q: How is lazy loading different from tree shaking?**
Tree shaking removes unused code at build time; lazy loading keeps code in the app but defers _loading/executing_ it until runtime, when it's actually needed.
