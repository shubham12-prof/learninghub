# Void

Represents the absence of a meaningful return value — used for functions that don't return anything useful (they may still implicitly return `undefined`, but the caller shouldn't rely on or use that value).

```ts
function logMessage(message: string): void {
  console.log(message);
  // no return statement — or `return;` with no value — both are fine
}

function greet(name: string): void {
  console.log(`Hello, ${name}`);
  return undefined; // technically allowed — `undefined` is the only value assignable to void
  // return "hi";  // ❌ Type 'string' is not assignable to type 'void'
}
```

**Void as a callback parameter type — a special, more lenient case:**

```ts
type Callback = () => void;

// A callback typed as `() => void` can accept a function that RETURNS something —
// TS just ignores/discards the return value, since the caller promised not to use it
const withReturn: Callback = () => {
  return 42;
}; // ✅ allowed, unusual but intentional TS behavior

[1, 2, 3].forEach((item): void => {
  console.log(item); // forEach's callback type is () => void, ignoring any return value
});
```

**`void` vs `undefined`:**

```ts
function returnsUndefined(): undefined {
  return undefined; // must explicitly return undefined, nothing else allowed
}
function returnsVoid(): void {
  // can omit return entirely, or return undefined — both fine
  // the CALLER is just not expected to use whatever comes back
}
```

**Interview note:** the special leniency around callback types (`() => void` accepting functions that return a value) exists specifically so common JS patterns like `array.push` (which returns the new length) can still be passed where a `void`-returning callback is expected, without forcing every callback to explicitly discard its return value.
