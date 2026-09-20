# Type Narrowing

The process by which TypeScript refines a broader type (usually a union) down to a more specific one, based on runtime checks in your code — the compiler tracks these checks through control flow ("control flow analysis").

```ts
function printLength(value: string | string[]) {
  if (typeof value === "string") {
    console.log(value.length); // TS knows: value is `string` here
  } else {
    console.log(value.length); // TS knows: value is `string[]` here
  }
}
```

**Narrowing techniques:**

```ts
// typeof narrowing — for primitives
function process(value: string | number) {
  if (typeof value === "string") {
    /* value: string */
  }
}

// truthiness narrowing
function greet(name?: string) {
  if (name) {
    console.log(name.toUpperCase());
  } // name: string (not undefined) here
}

// equality narrowing
function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    /* both narrowed to `string`, the only overlapping type */
  }
}

// instanceof narrowing — for classes
function handle(error: Error | string) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log(error.toUpperCase());
  }
}

// in narrowing — checks for property existence
type Fish = { swim: () => void };
type Bird = { fly: () => void };
function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}

// Array.isArray narrowing
function handleInput(input: string | string[]) {
  if (Array.isArray(input)) {
    input.forEach((s) => console.log(s));
  }
}
```

**Discriminated union narrowing (very common pattern, relies on a shared literal "tag" property):**

```ts
type Success = { status: "success"; data: string };
type Failure = { status: "error"; message: string };

function handle(result: Success | Failure) {
  if (result.status === "success") {
    console.log(result.data);
  } else {
    console.log(result.message);
  }
}
```

**Interview note:** narrowing is purely a **compile-time** feature — it doesn't change runtime behavior at all, it just lets the TypeScript compiler track, through your existing `if`/`switch`/`typeof` checks, which subset of a union type is possible at each point in the code, so it can safely allow type-specific operations there.
