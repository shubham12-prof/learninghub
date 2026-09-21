# Quick Interview Q&A

**Q: Why can't WeakMap keys be primitives?**
Because primitives are not garbage collected the way objects are (they're immutable values, often interned) — weak referencing only makes sense for objects that have their own identity in memory.

**Q: Name three common causes of memory leaks in JS apps.**
Uncleared timers/intervals, detached DOM nodes still referenced by JS variables, and event listeners that aren't removed when an element is discarded.

**Q: Why is WeakMap useful for private class data?**
Because entries are keyed by object identity and auto-removed when the object is no longer referenced elsewhere, giving you both privacy (can't be accessed without the WeakMap reference) and no memory leak risk.

**Q: What's the difference between Mark-and-Sweep and Reference Counting?**
Reference counting frees an object once its reference count hits zero, but fails with circular references. Mark-and-sweep instead checks reachability from root objects, correctly handling circular references.
