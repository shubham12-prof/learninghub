# Type Aliases

Gives a name to ANY type — not just object shapes (unlike interfaces, which are specifically for object/function shapes). Declared with the `type` keyword.

```ts
type ID = string | number; // alias for a union
type Point = { x: number; y: number }; // alias for an object shape
type Callback = (data: string) => void; // alias for a function type
type Status = "pending" | "active" | "closed"; // alias for a union of literals
```

**Type aliases can do things interfaces cannot — unions, intersections, tuples, mapped/conditional types:**

```ts
type StringOrNumber = string | number; // interfaces can't alias a union directly
type Coordinates = [number, number]; // tuple alias
type Nullable<T> = T | null; // generic utility alias
type EventHandlers = { [K in "click" | "hover"]: () => void }; // mapped type alias
```

**Interface vs Type Alias — the key comparison:**

|                                              | interface | type                                |
| -------------------------------------------- | --------- | ----------------------------------- |
| Object shapes                                | ✅        | ✅                                  |
| Unions/intersections/tuples/primitives       | ❌        | ✅                                  |
| Declaration merging (auto-combine same name) | ✅        | ❌ (error: duplicate identifier)    |
| `extends` keyword                            | ✅        | via `&` intersection instead        |
| Class `implements`                           | ✅        | ✅ (for object-shaped type aliases) |

```ts
// Extending — interface uses `extends`, type alias uses `&`
interface AnimalI {
  name: string;
}
interface DogI extends AnimalI {
  breed: string;
}

type AnimalT = { name: string };
type DogT = AnimalT & { breed: string };
```

**Interview note:** for object shapes, either works and the choice is largely stylistic/team-convention — many style guides recommend `interface` for public object/class shapes (to allow future declaration merging/extension) and `type` for unions, tuples, and utility/derived types where interfaces simply can't express what's needed.
