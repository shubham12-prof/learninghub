# Coding Challenges

### 1. Write a generic function that returns the last element of an array

```ts
function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}
last([1, 2, 3]); // number | undefined
last(["a", "b"]); // string | undefined
```

### 2. Implement your own version of `Pick`

```ts
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
}
type UserPreview = MyPick<User, "id" | "name">;
```

### 3. Write a discriminated union and an exhaustive handler function

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      const exhaustive: never = shape; // ensures ALL variants are handled
      return exhaustive;
  }
}
```

### 4. Write a type guard to validate unknown API data

```ts
interface Product {
  id: number;
  name: string;
  price: number;
}

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Product).id === "number" &&
    typeof (value as Product).name === "string" &&
    typeof (value as Product).price === "number"
  );
}

async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  const data: unknown = await res.json();
  if (!isProduct(data)) throw new Error("Invalid product shape from API");
  return data;
}
```

### 5. Build a simple generic `Stack<T>` class

```ts
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  get size(): number {
    return this.items.length;
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.pop(); // 2
```

### 6. Implement a `DeepReadonly<T>` utility type (recursive mapped type)

```ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config {
  server: { host: string; port: number };
  debug: boolean;
}
type ReadonlyConfig = DeepReadonly<Config>;
// server AND its nested properties are all readonly, not just the top level
```

### 7. Write a function overload set for a flexible `createElement`-style helper

```ts
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: "button"): HTMLButtonElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const input = createElement("input"); // HTMLInputElement — has .value, etc.
const button = createElement("button"); // HTMLButtonElement
```
