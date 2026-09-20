# Tuples

Fixed-length arrays where each position has a **specific, known type** — unlike regular arrays where every element shares the same type.

```ts
let point: [number, number] = [10, 20]; // exactly 2 numbers, in this order
let entry: [string, number] = ["age", 25]; // position 0 is string, position 1 is number

// entry = [25, "age"];      // ❌ wrong order/types
// entry = ["age", 25, true]; // ❌ too many elements
```

**Named tuple elements (improves readability, purely for documentation — doesn't change runtime behavior):**

```ts
let range: [start: number, end: number] = [0, 100];
```

**Optional and rest elements in tuples:**

```ts
let coord: [number, number, number?] = [10, 20]; // third element optional
let args: [string, ...number[]] = ["scores", 90, 85, 77]; // first is string, rest are numbers
```

**Common real-world use — React's `useState` returns a tuple:**

```ts
function useState<T>(initial: T): [T, (value: T) => void] {
  // ...
}
const [count, setCount] = useState(0); // count: number, setCount: (value: number) => void
// Without tuple typing, this would just be `(number | ((value: number) => void))[]`,
// losing the specific position-based type information.
```

**Destructuring tuples:**

```ts
function divide(a: number, b: number): [number, number] {
  return [Math.floor(a / b), a % b]; // [quotient, remainder]
}
const [quotient, remainder] = divide(17, 5);
```

**Interview note:** the key difference from a regular typed array (`number[]`) is that a tuple encodes **both length and per-position type**, letting TS catch errors like accessing the wrong index type or passing the wrong number of elements — this is exactly why Hook-style `[value, setter]` APIs are typed as tuples.
