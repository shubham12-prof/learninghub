# Quick Interview Q&A

**Q: Why prefer localStorage over cookies for client-only data?**
Cookies are sent with every HTTP request (adding overhead and exposure), have a tiny size limit (~4KB), while localStorage stays on the client, isn't transmitted automatically, and has a much bigger capacity.

**Q: Difference between `event.target` and `event.currentTarget`?**
`target` is the actual element that triggered the event (e.g., the child that was clicked). `currentTarget` is the element the listener is attached to (could be a parent, in event delegation).

**Q: How does event delegation improve performance?**
Instead of attaching a listener to every child element, you attach one listener to a common parent and use `event.target` to determine which child was interacted with — fewer listeners, works for dynamically added elements too.

**Q: Is localStorage synchronous or asynchronous, and why does it matter?**
Synchronous — it blocks the main thread, so storing large amounts of data can cause jank. IndexedDB is the async alternative for larger/complex data.
