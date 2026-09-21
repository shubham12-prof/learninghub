# Quick Interview Q&A

**Q: Why does `console.log(a); var a = 5;` print `undefined` and not throw an error?**
Because `var` declarations are hoisted and auto-initialized to `undefined` in the memory creation phase, before execution starts.

**Q: What's the difference between hoisting of `var` and `let`?**
Both are hoisted (allocated in memory), but `var` is initialized to `undefined` immediately, while `let`/`const` remain uninitialized in the TDZ until their declaration line executes.

**Q: Is JavaScript single-threaded?**
Yes — one call stack, one thing executing at a time. Asynchronous behavior (like `setTimeout`, promises) is handled by the browser/Node APIs + event loop, not by multiple threads of JS execution.

**Q: What creates a new execution context?**
Calling a function creates a new Function Execution Context, pushed onto the call stack.
