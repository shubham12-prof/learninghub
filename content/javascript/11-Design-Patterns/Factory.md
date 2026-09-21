# Factory

A function/object that creates and returns new objects without exposing the exact creation logic — useful when object creation involves conditional logic or varying types.

```js
function createUser(type, name) {
  const base = { name, createdAt: new Date() };

  switch (type) {
    case "admin":
      return {
        ...base,
        role: "admin",
        permissions: ["read", "write", "delete"],
      };
    case "guest":
      return { ...base, role: "guest", permissions: ["read"] };
    default:
      return { ...base, role: "user", permissions: ["read", "write"] };
  }
}

const admin = createUser("admin", "Alice");
const guest = createUser("guest", "Bob");
```

Class-based factory example:

```js
class ShapeFactory {
  static create(type, ...args) {
    switch (type) {
      case "circle":
        return new Circle(...args);
      case "square":
        return new Square(...args);
      default:
        throw new Error("Unknown shape type");
    }
  }
}
const shape = ShapeFactory.create("circle", 5);
```
