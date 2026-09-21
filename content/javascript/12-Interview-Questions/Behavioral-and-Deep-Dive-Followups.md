# Behavioral / Deep-Dive Follow-ups Interviewers Often Ask

- "Walk me through what happens in the event loop for this snippet." (be ready to trace call stack → microtask queue → macrotask queue)
- "How would you optimize this component/function for performance?" (mention memoization, debounce/throttle, lazy loading)
- "How would you avoid a memory leak in this code?" (cleanup listeners/timers, avoid stray global references)
- "Why did you choose `let` over `var` here?" (block scope, no leaking, TDZ safety)
- "How would you test this async function?" (mocking fetch, awaiting rejected/resolved promises, testing error paths)
