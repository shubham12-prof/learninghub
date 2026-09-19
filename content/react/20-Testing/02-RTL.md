# RTL (React Testing Library)

A library for testing React components by interacting with them the way a real user would — querying rendered output by visible text/roles/labels rather than internal component implementation details (state, props, instance methods). Its guiding principle: _"The more your tests resemble the way your software is used, the more confidence they can give you."_

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Counter from "./Counter";

test("increments the counter when button is clicked", async () => {
  render(<Counter />);

  const button = screen.getByRole("button", { name: /increment/i });
  const user = userEvent.setup();

  await user.click(button); // simulates a real user click event

  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

**Common queries (preferred order — most user-facing first):**

```jsx
screen.getByRole("button", { name: /submit/i }); // preferred — mirrors accessibility tree
screen.getByLabelText("Email"); // for form fields
screen.getByPlaceholderText("Search...");
screen.getByText("Welcome back");
screen.getByTestId("custom-element"); // last resort, no semantic meaning
```

**Query variants:** `getBy...` (throws if not found — use for elements that should exist), `queryBy...` (returns null if not found — use to assert something is ABSENT), `findBy...` (returns a Promise — use for elements that appear asynchronously).

```jsx
// Asserting something is absent
expect(screen.queryByText("Error")).not.toBeInTheDocument();

// Waiting for async UI (e.g., after a fetch resolves)
const successMessage = await screen.findByText("Loaded!");
```

**Testing forms:**

```jsx
test("submits the login form", async () => {
  render(<LoginForm onSubmit={mockSubmit} />);
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: /log in/i }));

  expect(mockSubmit).toHaveBeenCalledWith({
    email: "test@example.com",
    password: "secret",
  });
});
```

**Interview note:** RTL deliberately makes it awkward to test internal implementation details (like component state directly) — this is intentional, encouraging tests that survive refactors as long as user-facing behavior stays the same.
