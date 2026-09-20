# Intersection Types

Combines multiple types into one, requiring a value to satisfy **ALL** of them simultaneously, expressed with `&`.

```ts
type Named = { name: string };
type Aged = { age: number };

type Person = Named & Aged; // must have BOTH `name` AND `age`

const person: Person = { name: "Alice", age: 25 }; // ✅ satisfies both
// const invalid: Person = { name: "Alice" }; // ❌ missing `age`
```

**Common use case — combining smaller, reusable type "mixins":**

```ts
type Timestamped = { createdAt: Date; updatedAt: Date };
type Identifiable = { id: string };
type Sortable = { order: number };

type Entity = Identifiable & Timestamped;
type Task = Entity & Sortable & { title: string; completed: boolean };

const task: Task = {
  id: "t1",
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 1,
  title: "Write docs",
  completed: false,
};
```

**Merging function types (less common, but illustrates the concept):**

```ts
type Loggable = { log: (msg: string) => void };
type Serializable = { serialize: () => string };
type Service = Loggable & Serializable;
```

**Union (`|`) vs Intersection (`&`) — a very common point of confusion:**

|               | Union `A \| B`                                | Intersection `A & B`                           |
| ------------- | --------------------------------------------- | ---------------------------------------------- |
| Meaning       | value is A OR B                               | value is A AND B (must satisfy both)           |
| Result "size" | broader (fewer guaranteed members)            | narrower (more required properties/members)    |
| Typical use   | representing variants (one of several shapes) | composing multiple capabilities into one shape |

**Interview note:** intersecting two object types with a **conflicting property of incompatible types** produces `never` for that property (e.g., intersecting `{ id: string }` and `{ id: number }` makes `id` effectively `never`, since no value can be both a string and a number) — a subtle gotcha worth knowing.
