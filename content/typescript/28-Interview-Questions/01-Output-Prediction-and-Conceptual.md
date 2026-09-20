# Output Prediction & Conceptual Questions

## Output/Behavior-Prediction Questions

**Q1.**

```ts
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}
```

Is this valid? What does TypeScript know about `value` in each branch?

<details><summary>Answer</summary>

Valid — this is type narrowing. Inside the `if`, TS narrows `value` to `string` (so `.toUpperCase()` is safe); after the `if` (implicitly the `else` case), TS narrows it to `number` (so `.toFixed(2)` is safe).

</details>

**Q2.**

```ts
interface A {
  id: string;
}
interface B {
  id: number;
}
type C = A & B;
```

What is the effective type of `C["id"]`?

<details><summary>Answer</summary>

`never` — intersecting two incompatible types for the same property (`string` and `number`) results in `never`, since no value can satisfy both simultaneously.

</details>

**Q3.**

```ts
const arr = [1, 2, 3] as const;
arr.push(4);
```

What happens?

<details><summary>Answer</summary>

Compile error — `as const` makes the array a readonly tuple (`readonly [1, 2, 3]`), and `.push()` doesn't exist on readonly arrays.

</details>

**Q4.**

```ts
function fn(x: any) {
  return x.foo.bar.baz;
}
fn({});
```

Does this compile? What happens at runtime?

<details><summary>Answer</summary>

It compiles fine (no type errors at all, since `x` is `any`), but throws a runtime `TypeError: Cannot read properties of undefined` when called with `{}` — a classic illustration of why `any` disables type safety entirely.

</details>

---

## Conceptual Questions

1. What's the practical difference between `unknown` and `any`?
2. Explain the difference between `interface` and `type` — when would you specifically need one over the other?
3. What does `strictNullChecks` do, and why is it considered one of the most valuable strict-mode flags?
4. How do discriminated unions work, and why are they useful for modeling API responses/state?
5. Explain how `Pick`, `Omit`, and `Partial` are implemented under the hood (mapped types).
6. What's the difference between `type Foo = A | B` and `type Foo = A & B`?
7. Why does TypeScript erase all type information at compile time — what are the implications for runtime data validation?
8. What is a generic constraint, and why would you use `<T extends keyof SomeType>`?
9. Explain exhaustiveness checking with `never` and when you'd use it.
10. What's the purpose of `.d.ts` files, and how do they let you type plain JavaScript libraries?
