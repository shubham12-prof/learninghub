# Functions

Typing function parameters, return values, optional/default parameters, overloads, and `this`.

```ts
// Basic typed function
function add(a: number, b: number): number {
  return a + b;
}

// Optional parameters (must come after required ones)
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}`;
}

// Default parameters
function multiply(a: number, b: number = 2): number {
  return a * b;
}

// Rest parameters
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

// Arrow function typing
const subtract = (a: number, b: number): number => a - b;

// Function type as a variable annotation
let operation: (a: number, b: number) => number;
operation = add; // ✅ matches the signature
```

**Function overloads — multiple call signatures for the same function name:**

```ts
function makeDate(timestamp: number): Date;
function makeDate(month: number, day: number, year: number): Date;
function makeDate(monthOrTimestamp: number, day?: number, year?: number): Date {
  if (day !== undefined && year !== undefined) {
    return new Date(year, monthOrTimestamp, day);
  }
  return new Date(monthOrTimestamp);
}

makeDate(1704067200000); // ✅ matches first overload
makeDate(1, 15, 2024); // ✅ matches second overload
// makeDate(1, 15);              // ❌ no matching overload
```

**Typing `this` in a function (rare, but sometimes needed for callbacks/plugins):**

```ts
interface Button {
  addClickListener(this: Button, handler: () => void): void;
}
```

**Interview note:** function overloads only affect the type-checking of CALL SIGNATURES — the actual implementation is a single function body that must handle every overloaded case internally (usually with runtime checks like `typeof`), which is a common point of confusion for people new to overloads.
