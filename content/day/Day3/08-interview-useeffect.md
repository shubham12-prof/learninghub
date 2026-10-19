# 08 - Interview: `useEffect`

> **Time to learn:** ~45 min | **Interview frequency:** Almost guaranteed
> Read `04-hooks.md` first.

## 1. The 30-second answer (say this out loud)

> "`useEffect` lets a component synchronise with something outside React, like fetching data, subscribing to events, timers or touching the DOM. React runs the effect **after the component has rendered and the browser has painted**. The dependency array controls when it re-runs: no array means after every render, an empty array means once after mount, and a list of values means when any of them changed. The function I return is a **cleanup**: it runs before the effect re-runs and when the component unmounts, so I use it to cancel timers, unsubscribe or abort requests. In development, Strict Mode runs the effect, cleanup and effect again to check that my cleanup is correct."

## 2. The dependency array

```jsx
useEffect(() => {
  /* A */
}); // runs after EVERY render
useEffect(() => {
  /* B */
}, []); // runs once after the first render (and cleans up on unmount)
useEffect(() => {
  /* C */
}, [a, b]); // runs after the first render, and after any render where a or b changed
```

| Deps     | When the effect runs               | Typical use                          |
| -------- | ---------------------------------- | ------------------------------------ |
| none     | after every render                 | rare (logging, measuring)            |
| `[]`     | after mount only                   | one-time subscription, initial setup |
| `[a, b]` | on mount + when `a` or `b` changes | fetch for an `id`, sync a title      |

**Rule:** list **every reactive value** (props, state, values derived from them) that the effect **reads**. Don't "lie" to silence the linter; fix the effect instead (`eslint-plugin-react-hooks` flags it).

Dependencies are compared with `Object.is`. A new object/array/function created **on every render** looks "changed" each time:

```jsx
const options = { page: 1 }; // new object every render
useEffect(() => {
  load(options);
}, [options]); // runs after EVERY render
```

Fix: depend on primitives (`[page]`), move the object outside the component, or `useMemo` it.

## 3. Order of events

Observed output of a parent with a state `n` and a child (child effect has `[]`, parent effect has `[n]`):

```
parent render | child render | child effect | parent effect 0     <- mount: children's effects run BEFORE the parent's
(click => n becomes 1)
parent render | child render | parent cleanup 0 | parent effect 1  <- cleanup of the OLD effect, THEN the new effect
(unmount)
parent cleanup 1 | child cleanup
```

Key facts:

1. **Render first**, effects **after** (after the DOM is updated and painted).
2. On a re-run, the **previous cleanup runs first**, using the **old** values, then the new effect.
3. On unmount, cleanups run.
4. Effects run **children first, then parents**.

## 4. Cleanup

```jsx
useEffect(() => {
  function onResize() {
    setWidth(window.innerWidth);
  }
  window.addEventListener("resize", onResize); // subscribe
  return () => window.removeEventListener("resize", onResize); // cleanup: unsubscribe
}, []);
```

Things that **always** need a cleanup: event listeners, timers (`setInterval`, `setTimeout`), subscriptions (WebSocket, observers), in-flight requests, anything you "started".

## 5. Fetching data (and the race condition)

```jsx
function User({ id }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(`/api/users/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch doesn't reject on 404/500 (Day 2)
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // our own cancellation, ignore
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort(); // cancel when `id` changes or on unmount
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  return <h1>{user.name}</h1>;
}
```

**Why the cleanup matters (race condition):** if `id` changes from 1 to 2 quickly and request 1 is slower, its response would arrive **last** and overwrite the correct data. Aborting the old request (or ignoring its result) prevents this. This is the Day 2 "latest request wins" idea applied to React.

A version for APIs that can't be aborted uses an **ignore flag**:

```jsx
useEffect(() => {
  let ignore = false;
  load(id).then((data) => {
    if (!ignore) setUser(data);
  });
  return () => {
    ignore = true;
  };
}, [id]);
```

In real projects, a library such as **TanStack Query** or **SWR** (or a framework's data loading) handles caching, retries and race conditions for you.

## 6. Strict Mode: the effect runs twice in development

```jsx
<StrictMode>
  <App />
</StrictMode>
```

Sequence in development for an effect with `[]`: **effect -> cleanup -> effect**. React is **testing that your cleanup correctly undoes your setup**. It does not happen in production.

If the double run causes a visible bug (two subscriptions, two analytics events), the problem is a **missing or wrong cleanup**, not Strict Mode. Don't "fix" it with a `useRef` flag to run the effect once.

## 7. You might not need an effect

The most important modern advice: **many effects shouldn't exist.**

| Situation                                      | Wrong                               | Right                                              |
| ---------------------------------------------- | ----------------------------------- | -------------------------------------------------- |
| Derived data (filtered list, full name, total) | `useEffect` + `setState`            | Calculate it **during render**                     |
| Reacting to a **click / submit**               | effect watching a state flag        | Do it in the **event handler**                     |
| Reset state when a prop changes                | `useEffect(() => setX(init), [id])` | Give the component a **`key={id}`**                |
| Expensive calculation                          | effect + state                      | `useMemo` (or plain calculation)                   |
| Notify parent of a change                      | effect calling `onChange`           | Call `onChange` in the **handler** that changed it |

```jsx
// BAD: extra render + sync bug risk
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);

// GOOD
const fullName = first + " " + last;
```

**Use effects for:** fetching on mount/param change, subscriptions, timers, syncing with non-React widgets, analytics on page view, focusing/measuring the DOM.

## 8. `useLayoutEffect`

Same signature as `useEffect`, but runs **synchronously after DOM changes and before the browser paints**. Use it only when you must **measure the DOM and re-render before the user sees anything** (tooltip positioning), to avoid flicker. Default to `useEffect`.

## 9. Common mistakes

1. **No dependency array** with a state update inside: infinite loop. (In development React logs `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.`, but it does not stop the loop for you.)
   ```jsx
   useEffect(() => {
     setCount(count + 1);
   }); // renders, effect, setState, renders, ...
   ```
2. **Object/array/function dependency created in render** -> runs every render.
3. **Missing dependencies** -> stale values (the effect uses an old `count`, `props`, etc.).
4. **No cleanup** for listeners, timers, requests -> leaks and race conditions.
5. Using an effect for **derived state** or **event-driven logic**.
6. Making the effect callback itself `async` (`useEffect(async () => ...)`): it returns a promise instead of a cleanup function. Define and call an async function **inside**.
7. "Fixing" Strict Mode double effects with a ref instead of a cleanup.
8. Updating state after unmount (modern React no longer warns, but the work is wasted: abort it).

## 10. Follow-up questions to expect

**Q: How do class lifecycle methods map to `useEffect`?**
Roughly: `componentDidMount` -> `[]`; `componentDidUpdate` -> `[deps]`; `componentWillUnmount` -> the cleanup. But think in terms of **synchronisation** ("keep this in sync with these values"), not lifecycle.

**Q: When does `useEffect` run relative to painting?**
**After** the browser paints (so it doesn't block the screen). `useLayoutEffect` runs **before** paint.

**Q: Can I `await` inside `useEffect`?**
Not on the callback itself; declare an inner `async function` and call it.

**Q: Why is my effect running twice?**
Strict Mode in development (render and effects are doubled to catch impurities). Production runs once.

**Q: What if a dependency is a function?**
Define the function **inside** the effect, move it outside the component, or wrap it in `useCallback`.

**Q: Effect vs event handler?**
If it happens **because of a user action**, put it in the **handler**. If it happens **because the component is on screen / a value changed**, it's an effect.

## 11. Predict the output

**Q1** Which logs appear when the component first mounts, and after clicking "A" once, then "B" once?

```jsx
function C() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  useEffect(() => {
    console.log("every");
  });
  useEffect(() => {
    console.log("once");
  }, []);
  useEffect(() => {
    console.log("a=" + a);
  }, [a]);
  return (
    <>
      <button onClick={() => setA(a + 1)}>A</button>
      <button onClick={() => setB(b + 1)}>B</button>
    </>
  );
}
```

**Q2** Sequence of logs for mount, one click, and unmount?

```jsx
function Child() {
  console.log("child render");
  useEffect(() => {
    console.log("child effect");
    return () => console.log("child cleanup");
  }, []);
  return null;
}
function Parent() {
  console.log("parent render");
  const [n, setN] = useState(0);
  useEffect(() => {
    console.log("parent effect " + n);
    return () => console.log("parent cleanup " + n);
  }, [n]);
  return (
    <>
      <button onClick={() => setN(n + 1)}>x</button>
      <Child />
    </>
  );
}
```

**Q3** What is logged in development with `<StrictMode>` when this mounts?

```jsx
function C() {
  console.log("render");
  useEffect(() => {
    console.log("effect");
    return () => console.log("cleanup");
  }, []);
  return null;
}
```

**Q4** What goes wrong here?

```jsx
useEffect(async () => {
  const res = await fetch(url);
  setData(await res.json());
}, [url]);
```

**Q5** User switches quickly from id=1 (slow, 150 ms) to id=2 (fast, 20 ms) with the fetch effect from section 5. Which name is displayed at the end, and what happens to request 1?

## 12. Answers

- **Q1:** mount: `every`, `once`, `a=0` -> click A: `every`, `a=1` -> click B: `every`. (`once` never again; `a=...` only when `a` changed.)
- **Q2:** `parent render` / `child render` / `child effect` / `parent effect 0` -> click: `parent render` / `child render` / `parent cleanup 0` / `parent effect 1` -> unmount: `parent cleanup 1` / `child cleanup`. (`Child` re-renders with its parent, but its `[]` effect doesn't run again.)
- **Q3:** `render`, `render`, `effect`, `cleanup`, `effect`.
- **Q4:** The effect callback returns a **promise**, not a cleanup function. In development React warns (`useEffect must not return anything besides a function, which is used for clean-up`), and when the component unmounts or the effect re-runs, React tries to call that promise as the cleanup and crashes with `destroy is not a function`. Define an inner async function and call it, with a `.then` / cleanup for aborting.
- **Q5:** **User 2.** The cleanup aborted request 1 (or its result is ignored), so the late response can't overwrite user 2.

## Recap

- Effects **synchronise with the outside world**, run **after** render/paint, and are controlled by the **dependency array** (none / `[]` / `[deps]`).
- **Cleanup** runs before the next effect and on unmount: remove listeners, clear timers, abort requests.
- Strict Mode runs effect -> cleanup -> effect in development to verify your cleanup.
- Handle fetch race conditions with `AbortController` or an ignore flag.
- Don't use effects for derived state or user-action logic: calculate during render or use event handlers (and `key` to reset state).

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can explain none / `[]` / `[deps]`
- [ ] I can write a fetch effect with loading, error and cleanup
- [ ] I can list 3 cases where an effect is the wrong tool
- [ ] I got Q1 to Q5 right without looking
