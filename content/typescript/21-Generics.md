# Generics

Lets you write reusable functions, classes, and types that work with a variety of types while still preserving type information — avoiding both code duplication and the type-safety loss of using `any`.

```ts
// Without generics — either duplicated code, or loses type info with `any`
function firstAny(arr: any[]): any {
  return arr[0];
}

// With generics — <T> is a placeholder, inferred (or specified) at the call site
function first<T>(arr: T[]): T {
  return arr[0];
}

const num = first([1, 2, 3]); // T inferred as number, num: number
const str = first(["a", "b"]); // T inferred as string, str: string
const explicit = first<boolean>([true]); // explicitly specifying T
```

**Generic interfaces/types:**

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

const userResponse: ApiResponse<User> = {
  data: { id: 1, name: "Alice" },
  status: 200,
};
const postsResponse: ApiResponse<Post[]> = { data: [], status: 200 };
```

**Generic classes:**

```ts
class Box<T> {
  private contents: T;
  constructor(value: T) {
    this.contents = value;
  }
  getValue(): T {
    return this.contents;
  }
}
const numberBox = new Box<number>(42);
const stringBox = new Box("hello"); // T inferred as string
```

**Multiple type parameters:**

```ts
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}
const result = pair("age", 25); // [string, number]
```

**Interview note:** generics preserve the RELATIONSHIP between input and output types (e.g., "whatever array element type comes in, that same type comes out of `first()`") — something `any` fundamentally can't do, since `any` discards type information entirely, while generics keep it intact and specific to each call site.
