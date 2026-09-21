# Quick Interview Q&A

**Q: Does `try/catch` catch async errors from `setTimeout`?**
No — those run in a separate macrotask after the try block has already finished executing. Only errors from `await`ed promises inside the try block are caught.

**Q: Why extend `Error` instead of throwing a plain object?**
`Error` instances automatically get `.message` and `.stack` (useful for debugging), and can be checked reliably with `instanceof`, integrating properly with tools/loggers that expect real Error objects.

**Q: What does `finally` guarantee?**
Its code runs regardless of whether the `try` succeeded, the `catch` handled an error, or even if a `return`/`throw` happened inside either block — used for guaranteed cleanup (closing connections, hiding loaders, etc.).

**Q: How do you re-throw an error after partially handling it?**
Catch it, do your logging/cleanup, then `throw err;` again inside the catch block so it propagates up to the next handler.
