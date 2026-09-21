# Quick Interview Q&A

**Q: What problem does the Singleton pattern solve, and what's a downside?**
It guarantees a single shared instance (good for config/connections), but can introduce hidden global state, make unit testing harder (shared state across tests), and create tight coupling.

**Q: How is the Factory pattern different from just calling `new` directly?**
A factory centralizes and abstracts the object-creation logic (which can vary based on input/conditions), so consumers don't need to know the concrete class or constructor details — easier to extend/change later.

**Q: Give a real-world browser example of the Observer pattern.**
`element.addEventListener('click', callback)` — the DOM element is the subject, and every registered callback is an observer notified when the click event ("state change") occurs.

**Q: How does the Module pattern achieve privacy without classes?**
By using an IIFE (Immediately Invoked Function Expression) that creates a closure — variables declared inside stay private to that closure, and only the returned object's properties are accessible outside.
