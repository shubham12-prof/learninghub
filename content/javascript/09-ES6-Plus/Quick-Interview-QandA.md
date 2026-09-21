# Quick Interview Q&A

**Q: Why can't you mix `??` and `||`/`&&` directly without parentheses?**
`(a || b ?? c)` throws a SyntaxError — JS forces you to be explicit with parentheses `(a || b) ?? c` to avoid ambiguous precedence bugs.

**Q: What makes an object "iterable" in JS?**
Implementing a `[Symbol.iterator]` method that returns an iterator (an object with `next()`). Arrays, Strings, Maps, and Sets are iterable by default; plain objects are not.

**Q: How are generators related to iterators?**
Every generator function, when called, returns a generator object that automatically implements the iterator protocol (`next()`, and is also itself iterable via `[Symbol.iterator]`).

**Q: `??` vs `||` — when would you specifically need `??`?**
When `0`, `""`, `NaN`, or `false` should be treated as valid values rather than "missing" — e.g., a quantity field where `0` is meaningful and shouldn't fall back to a default.
