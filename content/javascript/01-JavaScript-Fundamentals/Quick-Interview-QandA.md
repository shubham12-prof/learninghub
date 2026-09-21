# Quick Interview Q&A

**Q: Difference between `null` and `undefined`?**
`undefined` means a variable has been declared but not assigned. `null` is an explicit assignment representing "no value."

**Q: Why is `typeof null === "object"`?**
A legacy bug from JS's original implementation, kept for backward compatibility.

**Q: What's the difference between rest and spread?**
Rest _collects_ multiple elements into an array (used in function parameters/destructuring). Spread _expands_ an array/object into individual elements (used in function calls/array or object literals).

**Q: `==` vs `===`?**
`==` performs type coercion before comparing; `===` compares both type and value without coercion. Always prefer `===` unless you have a specific reason.
