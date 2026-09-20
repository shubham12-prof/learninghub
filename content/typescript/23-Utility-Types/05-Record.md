# Record

Constructs an object type whose keys are of one type and whose values are all of another type — a concise way to type dictionaries/maps.

```ts
type Scores = Record<string, number>;
// equivalent to: { [key: string]: number }

const scores: Scores = {
  alice: 95,
  bob: 87,
};
```

**Using a union of literal types as keys — every key MUST be present (unlike a plain index signature):**

```ts
type Theme = "light" | "dark" | "auto";

const themeLabels: Record<Theme, string> = {
  light: "Light Mode",
  dark: "Dark Mode",
  auto: "System Default",
};
// If you forget a key (e.g. omit "auto"), TS errors — Record enforces ALL keys are present
```

**How it's implemented internally (a mapped type over a union of keys):**

```ts
type MyRecord<K extends keyof any, V> = {
  [P in K]: V;
};
```

**Common real-world use — mapping enum/union values to configuration or handler functions:**

```ts
type ActionType = "increment" | "decrement" | "reset";

const handlers: Record<ActionType, () => void> = {
  increment: () => console.log("incrementing"),
  decrement: () => console.log("decrementing"),
  reset: () => console.log("resetting"),
};

function dispatch(action: ActionType) {
  handlers[action](); // type-safe lookup, guaranteed to exist
}
```

**Interview note:** `Record<UnionOfLiterals, V>` is stricter and often more useful than a plain index signature (`{ [key: string]: V }`) because it forces you to provide a value for EVERY possible key in the union at compile time — catching a missing case immediately, rather than silently allowing `undefined` at a missing key.
