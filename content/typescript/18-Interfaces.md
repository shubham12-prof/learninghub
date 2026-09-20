# Interfaces

Declares the shape of an object — the primary way to name and reuse object type contracts in TypeScript.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  isAdmin?: boolean; // optional property
  readonly createdAt: Date; // can't be reassigned after creation
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date(),
};
```

**Interfaces for functions:**

```ts
interface Add {
  (a: number, b: number): number;
}
const add: Add = (a, b) => a + b;
```

**Extending interfaces (inheritance between shapes):**

```ts
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

const dog: Dog = { name: "Rex", breed: "Labrador" }; // must satisfy BOTH

// Can extend multiple interfaces at once
interface Employee extends Person, Timestamped {}
```

**Declaration merging — a unique interface feature (types can't do this):**

```ts
interface Window {
  customProp: string;
}
interface Window {
  anotherProp: number;
} // merges with the previous declaration

// Window now effectively has BOTH customProp and anotherProp
// Useful for extending third-party/global types without modifying their source
```

**Implementing an interface in a class:**

```ts
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() {
    return Math.PI * this.radius ** 2;
  }
}
```

**Interview note:** "Interface vs type alias?" — see the Type Aliases file for the full comparison, but the headline difference is that interfaces support **declaration merging** (multiple declarations with the same name auto-combine) while type aliases don't — this makes interfaces the conventional choice for public library APIs that consumers might want to extend/augment.
