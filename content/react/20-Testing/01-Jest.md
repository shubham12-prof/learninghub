# Jest

A JavaScript testing framework — test runner, assertion library, and mocking utilities all in one. The default test runner for Create React App projects (Vite projects typically use Vitest, which shares a near-identical API).

```js
// sum.js
export function sum(a, b) {
  return a + b;
}

// sum.test.js
import { sum } from "./sum";

describe("sum()", () => {
  test("adds two positive numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });

  test("handles negative numbers", () => {
    expect(sum(-1, -1)).toBe(-2);
  });
});
```

**Common matchers:**

```js
expect(value).toBe(5); // strict equality (===)
expect(obj).toEqual({ a: 1 }); // deep equality
expect(arr).toContain(3); // array/iterable membership
expect(fn).toThrow(); // function throws an error
expect(value).toBeNull();
expect(value).toBeTruthy();
expect(value).toBeGreaterThan(2);
```

**Mocking functions and modules:**

```js
const mockFn = jest.fn(() => 42);
mockFn();
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(); // no args in this call

// Mocking a module (e.g., an API client)
jest.mock("./api");
import { fetchUser } from "./api";
fetchUser.mockResolvedValue({ name: "Alice" });
```

**Setup/teardown hooks:**

```js
beforeEach(() => {
  /* runs before every test */
});
afterEach(() => {
  /* runs after every test — good for cleanup */
});
beforeAll(() => {
  /* runs once before all tests in this file */
});
```

**Interview note:** Jest handles unit and integration test _execution_ (running test files, assertions, mocking) — for testing actual React component output/behavior, it's paired with **React Testing Library** (see its own file), which provides the DOM-querying and interaction APIs Jest itself doesn't include.
