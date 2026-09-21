# Quick Interview Q&A

**Q: Difference between `map` and `forEach`?**
`map` returns a new array with transformed values; `forEach` returns `undefined` and is used purely for side effects.

**Q: How do you deep clone an object?**
`structuredClone(obj)` (modern), or `JSON.parse(JSON.stringify(obj))` (loses functions/undefined/dates), or a recursive custom function / library like lodash `cloneDeep`.

**Q: Is `Object.freeze` deep or shallow?**
Shallow — nested objects inside a frozen object can still be mutated.

**Q: Which array methods mutate the original array?**
`push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin`. Everything else (`map, filter, slice, concat, reduce`) returns a new array/value.
