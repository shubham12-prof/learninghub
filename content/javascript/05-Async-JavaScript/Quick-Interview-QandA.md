# Quick Interview Q&A

**Q: Why does a `setTimeout(fn, 0)` not run immediately?**
Because it's a macrotask — it still has to wait for the current call stack to empty AND for all pending microtasks to drain first.

**Q: Do microtasks or macrotasks run first?**
Microtasks (promise callbacks) always run first, and ALL of them run before the next macrotask is picked up.

**Q: What happens if you don't catch a rejected promise?**
You get an "Unhandled Promise Rejection" — in Node this can crash the process (depending on version/config); in browsers it logs a console warning.

**Q: `Promise.all` vs `Promise.allSettled`?**
`all` short-circuits and rejects immediately if any promise rejects. `allSettled` always waits for every promise and gives you the outcome (success or failure) of each.
