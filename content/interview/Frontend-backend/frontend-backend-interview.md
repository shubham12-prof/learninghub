# Frontend & Backend Interview Guide (Simple Explanations + Code)

---

## 🔹 React & Hooks

### 1. How do you compare previous and current prop values in a functional component?

In a class component, you had `componentDidUpdate(prevProps)`. In a functional component, there's no built-in "previous props" — you have to **store the previous value yourself**, usually with `useRef`, and compare it inside a `useEffect`.

```jsx
import { useEffect, useRef } from "react";

function MyComponent({ value }) {
  const prevValueRef = useRef();

  useEffect(() => {
    const prevValue = prevValueRef.current;

    if (prevValue !== value) {
      console.log("Value changed from", prevValue, "to", value);
    }

    // update the ref AFTER comparing, so next render it holds the "old" value
    prevValueRef.current = value;
  }, [value]);

  return <div>{value}</div>;
}
```

**Simple idea:** `useRef` acts like a little box that remembers a value across renders without causing a re-render itself. You save the old value in the box, compare it to the new one, then update the box.

---

### 2. Why use `useRef` instead of `useState`?

- `useState` → when you update it, React **re-renders** the component.
- `useRef` → when you update `.current`, React does **NOT** re-render the component.

Use `useRef` when you want to **remember something between renders** but that value **doesn't need to show up on the screen** — like:

- storing the previous prop/state value
- storing a timer ID (`setTimeout`/`setInterval`)
- referencing a DOM element (`<input ref={...} />`)
- storing a value used only inside logic, not in the UI

**Simple idea:** `useState` = "this affects what the user sees." `useRef` = "this is just for my own bookkeeping."

---

### 3. Can `useState` be used to track the previous value?

Yes, technically you can:

```jsx
function MyComponent({ value }) {
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    setPrevValue(value);
  }, [value]);

  return (
    <div>
      Prev: {prevValue}, Current: {value}
    </div>
  );
}
```

But this is **not ideal** — see next answer for why.

---

### 4. Why can using state for this purpose cause unnecessary re-renders?

Every time you call `setPrevValue(...)`, React schedules a **re-render**, even though that "previous value" isn't something the user directly needs to see change immediately — it's just internal bookkeeping.

So the flow becomes:

1. `value` prop changes → component re-renders (necessary).
2. `useEffect` runs → calls `setPrevValue(value)` → **triggers another re-render** (often unnecessary).

That's **two renders** for one prop change, when really you only needed one. With `useRef`, updating `.current` doesn't trigger any render at all — so you get the "remember the old value" behavior with **zero extra renders**.

**Simple rule of thumb:** If a re-render isn't needed to update the UI, use `useRef` instead of `useState`.

---

## 🔹 DOM & Modal

### 5. How would you close a modal when clicking outside but keep it open when clicking inside?

Use a `ref` on the modal box, and listen for clicks anywhere in the document. If the click target is **not inside** the modal ref, close it.

```jsx
import { useEffect, useRef, useState } from "react";

function Modal({ onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-box" ref={modalRef}>
        {children}
      </div>
    </div>
  );
}
```

**Simple idea:** Attach a `ref` to the modal box itself, listen for clicks on the whole `document`, and check `.contains()` to know if the click happened inside or outside.

---

### 6. Where would you register the event?

Register it on the **`document`** (or `window`), not on the modal itself. Why? Because you need to catch clicks that happen **anywhere on the page**, including outside the modal. If you only listened on the modal element, you'd never detect an "outside click" in the first place.

Always **clean up** the listener in the `useEffect` return function (`removeEventListener`) so it doesn't stay attached after the modal unmounts — this prevents memory leaks and bugs.

---

### 7. How would you identify whether the click happened inside or outside the modal?

Use the DOM method **`.contains()`**:

```js
modalRef.current.contains(event.target);
```

- `event.target` is the actual DOM element that was clicked.
- `modalRef.current` is the modal's container DOM node.
- `.contains()` checks if `event.target` is that node or a descendant of it.

If `.contains()` returns `false`, the click was outside → close the modal.
If it returns `true`, the click was inside → do nothing (let it stay open).

---

## 🔹 Redux & State Management

### 8. Explain Redux architecture at a high level.

Redux keeps **all your app's state in one central "store"**, and the only way to change that state is by **dispatching actions**.

```
[UI Component] --dispatch(action)--> [Store] --calls--> [Reducer] --returns--> [New State] --updates--> [UI Component]
```

Core pieces:

- **Store** – single object holding the entire app state.
- **Action** – a plain object describing "what happened" (e.g. `{ type: "ADD_ITEM", payload: {...} }`).
- **Reducer** – a pure function: `(currentState, action) => newState`. It decides how state changes based on the action.
- **Dispatch** – the function you call to send an action to the store.
- **Selectors** – functions that read specific pieces of state (often used with `useSelector` in React-Redux).

**Simple idea:** Think of Redux like a bank ledger. You don't erase and rewrite entries directly — you submit a "transaction" (action), and a strict clerk (reducer) applies the rule and updates the official record (store).

---

### 9. Context API vs Redux?

|                      | Context API                                              | Redux                                                      |
| -------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| Purpose              | Avoid prop drilling for a few values                     | Manage complex, app-wide state                             |
| Setup                | Built into React, minimal boilerplate                    | Extra library, more setup                                  |
| DevTools             | None built-in                                            | Powerful DevTools (time-travel debugging, action logs)     |
| Middleware           | Not built-in                                             | Supports middleware (logging, async via thunk/saga)        |
| Performance at scale | Can cause broad re-renders                               | Optimized to avoid unnecessary re-renders                  |
| Best for             | Theme, auth user, language — simple/rarely-changing data | Large apps with frequently-changing, shared, complex state |

**Simple idea:** Context is great for "a few values that rarely change." Redux is built for "lots of state that changes often and needs structure."

---

### 10. Why can Context become problematic in large applications?

- **Every consumer of a Context re-renders whenever the Context value changes** — even if that consumer only cares about a small part of it.
- There's no built-in way to select just a "slice" of context data like Redux's `useSelector` does.
- As state grows more complex (multiple unrelated pieces of data), you end up creating many separate Contexts, which gets messy to manage.
- No built-in middleware, so handling async logic, logging, or debugging tools requires you to build that yourself.

---

### 11. Why does Context cause re-renders?

When a Context Provider's `value` changes, **React re-renders every component that consumes that Context** with `useContext`, regardless of whether that specific component actually uses the part of the value that changed.

Example problem:

```jsx
<MyContext.Provider value={{ user, theme }}>
```

If `theme` changes, any component reading `user` from this same context **still re-renders**, even though `user` didn't change — because the entire `value` object is treated as "new."

**Fix approach:** split into separate contexts (`UserContext`, `ThemeContext`) so components only re-render for the data they actually depend on.

---

### 12. How does Redux avoid unnecessary component re-renders?

Redux (via `react-redux`'s `useSelector`) lets each component **subscribe only to the specific slice of state it needs**:

```jsx
const username = useSelector((state) => state.user.name);
```

- `useSelector` runs a comparison (by default, strict equality `===`) between the previous selected value and the new one.
- If the selected value hasn't changed, **that component does not re-render** — even if other unrelated parts of the store changed.

This is fundamentally different from Context, where the _whole_ value object triggers re-renders for _every_ consumer.

**Simple idea:** Redux lets components say "I only care about this one drawer in the filing cabinet" instead of "wake me up whenever anything in the cabinet changes."

---

## 🔹 API & Production Debugging

### 13. How do you design a REST API?

Key principles:

1. **Use nouns for resources, not verbs** — `/users`, `/orders/123`, not `/getUser`.
2. **Use HTTP methods properly**:
   - `GET` – read
   - `POST` – create
   - `PUT`/`PATCH` – update (full/partial)
   - `DELETE` – remove
3. **Use proper status codes** (see next answer).
4. **Version your API** — e.g. `/api/v1/users`.
5. **Support pagination, filtering, sorting** for large lists — `/orders?page=2&limit=20&status=pending`.
6. **Consistent response shape**, e.g.:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

7. **Authentication/authorization** — e.g. JWT tokens in headers.
8. **Good error messages** that are safe (don't leak internal details) but helpful.

---

### 14. What HTTP status codes/errors do you handle?

Common ones a frontend/backend dev should handle:

| Code | Meaning               | When                                                    |
| ---- | --------------------- | ------------------------------------------------------- |
| 200  | OK                    | Successful GET/PUT/PATCH                                |
| 201  | Created               | Successful POST that creates a resource                 |
| 204  | No Content            | Successful request with nothing to return (e.g. DELETE) |
| 400  | Bad Request           | Invalid input from client                               |
| 401  | Unauthorized          | Missing/invalid auth token                              |
| 403  | Forbidden             | Authenticated but not allowed                           |
| 404  | Not Found             | Resource doesn't exist                                  |
| 409  | Conflict              | e.g. duplicate entry                                    |
| 422  | Unprocessable Entity  | Validation errors                                       |
| 429  | Too Many Requests     | Rate limiting                                           |
| 500  | Internal Server Error | Unexpected server crash/bug                             |
| 503  | Service Unavailable   | Server overloaded/down for maintenance                  |

On the frontend, you typically handle these in a centralized place (like an Axios interceptor) so you don't repeat error-handling logic everywhere.

---

### 15. What should the frontend do when an API returns no data?

Don't just show a blank screen. Good practice:

- Show a clear **"empty state" UI** (e.g. "No orders found" with a friendly icon/illustration).
- Distinguish between **"no data" vs "still loading" vs "error"** — these are three different states and should look different to the user.
- If applicable, offer a call-to-action (e.g. "Add your first item").

```jsx
function OrdersList({ orders, isLoading, error }) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message="Something went wrong." />;
  if (!orders || orders.length === 0)
    return <EmptyState text="No orders yet." />;

  return orders.map((order) => <OrderCard key={order.id} order={order} />);
}
```

---

### 16. How do you troubleshoot runtime errors occurring in production that aren't visible in the browser console?

Since you can't just open DevTools on a random user's browser, you need **proactive monitoring**:

1. **Error tracking tools** – Sentry, LogRocket, Bugsnag, Datadog RUM. These automatically capture JS errors, stack traces, and even session replays from real users.
2. **Global error handlers** in the app:

```js
window.onerror = function (message, source, lineno, colno, error) {
  // send error details to your logging service
};

window.addEventListener("unhandledrejection", (event) => {
  // catch unhandled promise rejections
});
```

3. **Source maps** – upload them to your error tracker (but don't expose them publicly) so minified production code maps back to readable file/line info.
4. **Logging with context** – attach user ID, browser, app version, and the action they were doing when the error happened.
5. **React Error Boundaries** – catch rendering errors in specific parts of the UI instead of crashing the whole app, and log them.

```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    logErrorToService(error, info);
  }
  render() {
    if (this.state?.hasError) return <FallbackUI />;
    return this.props.children;
  }
}
```

6. **Backend logs + correlation IDs** – tag each request with a unique ID so you can trace a frontend error back to the exact backend request/response that caused it.
7. **Feature flags / gradual rollout** – roll out risky changes to a small % of users first, so bugs affect fewer people and are easier to isolate.

---

## 🔹 Node.js / Express

### 17. What is middleware and why do we use it?

Middleware is a function that sits **between the incoming request and the final response**. It can inspect, modify, or reject the request before it reaches your route handler — or modify the response before it's sent back.

```js
function loggerMiddleware(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // pass control to the next middleware/route
}

app.use(loggerMiddleware);
```

**Why use it?**

- Reusable logic across many routes: authentication, logging, input validation, error handling, CORS, compression, etc.
- Keeps route handlers clean — they just focus on business logic, not repeated boilerplate.

**Simple idea:** Middleware is like security checkpoints at an airport — every request passes through a series of checks (ID check, bag scan, boarding pass check) before reaching the gate (your route handler).

---

### 18. Is middleware synchronous or asynchronous?

It can be **either** — Express doesn't care, as long as you eventually call `next()` (for sync) or handle it properly (for async).

- **Synchronous middleware** runs and calls `next()` immediately:

```js
function syncMiddleware(req, res, next) {
  req.startTime = Date.now();
  next();
}
```

- **Asynchronous middleware** does something like a DB call or API request, and calls `next()` only after that finishes:

```js
async function asyncMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    req.user = user;
    next();
  } catch (err) {
    next(err); // pass error to Express's error handler
  }
}
```

**Important:** If your async middleware throws an error and you don't catch it, Express (in older versions, pre-Express 5) won't catch it automatically — the request can hang or crash. Always wrap async middleware in try/catch and pass errors to `next(err)`.

---

### 19. How do you perform asynchronous operations inside middleware?

Use `async/await` (or Promises), and make sure to call `next()` once the async work is done — and always handle errors:

```js
async function checkUserExists(req, res, next) {
  try {
    const user = await db.users.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err); // forwards to centralized error-handling middleware
  }
}
```

A common helper pattern to avoid repeating try/catch everywhere:

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  }),
);
```

---

### 20. How would you handle multiple asynchronous API calls efficiently?

Depends on whether the calls **depend on each other** or are **independent**:

**Independent calls → run in parallel with `Promise.all`:**

```js
async function getDashboardData(userId) {
  const [profile, orders, notifications] = await Promise.all([
    fetchProfile(userId),
    fetchOrders(userId),
    fetchNotifications(userId),
  ]);

  return { profile, orders, notifications };
}
```

This is much faster than calling them one after another (`await` each sequentially), because they all start at the same time instead of waiting on each other.

**Dependent calls → run sequentially:**

```js
async function checkoutFlow(userId, cartId) {
  const cart = await fetchCart(cartId); // need cart first
  const total = await calculateTotal(cart); // needs cart result
  const order = await createOrder(userId, total); // needs total
  return order;
}
```

**Some succeed, some may fail → use `Promise.allSettled`:**

```js
const results = await Promise.allSettled([
  fetchProfile(userId),
  fetchOrders(userId),
]);
// results won't throw even if one call fails — you get status: 'fulfilled' or 'rejected' for each
```

**Simple rule of thumb:**

- Calls don't depend on each other → `Promise.all` (fast, parallel).
- One call needs the result of another → sequential `await`.
- You want partial results even if some calls fail → `Promise.allSettled`.

---

_End of guide — good luck with your interview!_
