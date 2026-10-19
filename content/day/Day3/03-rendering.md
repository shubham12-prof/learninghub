# 03 - Rendering and Re-rendering

> **Time to learn:** ~40 min | **Level:** Core concept (explains "why did my component re-render?") | **Interview frequency:** Very high

## 1. What does "rendering" mean in React?

**Rendering = React calling your component function** to find out what it should look like. The function returns **JSX** (a description of the UI), not real DOM.

```jsx
function Welcome({ name }) {
  console.log("render Welcome"); // runs every time React renders this component
  return <h1>Hello {name}</h1>; // returns a description (React elements)
}
```

A render is **not** the same as updating the screen. React does three separate things:

| Step           | What happens                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **1. Trigger** | Something asks for a render: first mount, or a state update                                                |
| **2. Render**  | React **calls your components** and compares the result with the previous one (no DOM changes yet)         |
| **3. Commit**  | React applies **only the differences** to the real DOM; then runs layout effects and, after paint, effects |

So a component can render **without the DOM changing at all** (if the output is the same, React touches nothing).

## 2. Analogy

A restaurant: **trigger** = a new order, **render** = the chef writes the updated menu board on paper (cheap, nothing visible yet), **commit** = the waiter changes **only the lines that differ** on the real board in the dining room.

## 3. What triggers a re-render?

1. **The component's own state changes** (`setX` with a _different_ value).
2. **Its parent re-renders** (children re-render by default, **even if their props are identical**).
3. **A context it consumes changes** (`useContext`).

What does **not** trigger one: changing a regular variable, changing a `useRef` value, mutating state without calling the setter.

### 3.1 Parent re-render re-renders children

```jsx
function Parent() {
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>parent state: {n}</button>
      <Child /> // re-renders on every click, even though it has no props
    </div>
  );
}
```

This is normal and usually **fast enough**. Don't optimise until you have a real problem (see section 7).

### 3.2 Setting the same value

If you call the setter with a value that is `Object.is`-equal to the current one, React **bails out**: it skips re-rendering the children and doesn't commit anything.

```jsx
const [n, setN] = useState(0);
<button onClick={() => setN(0)}>same</button>; // no re-render of children
```

(In rare cases React may call the component function one more time before bailing out, but it never re-renders the children or changes the DOM.)

## 4. The virtual DOM and reconciliation

React keeps a lightweight tree of JavaScript objects (the **React elements**). On each render it builds a new tree, **compares it with the previous one** (**reconciliation / "diffing"**) and updates the real DOM with the **minimum changes**.

The diffing rules (simplified):

1. **Different element types** (`<div>` -> `<section>`, or `<A />` -> `<B />`): React **destroys the old subtree** (state lost) and builds a new one.
2. **Same type at the same position:** React **keeps** the instance (state preserved) and just updates props/attributes.
3. **Lists:** React matches children by **`key`** (see `09-interview-keys-rerendering.md`).

### State belongs to a **position in the tree**

```jsx
function SameSpot() {
  const [showA, setShowA] = useState(true);
  return (
    <div>
      <button onClick={() => setShowA(!showA)}>flip</button>
      {showA ? <Counter label="A" /> : <Counter label="B" />}
    </div>
  );
}
```

`<Counter>` is the **same type in the same position**, so when you flip, React **reuses** it: the count is **kept** (only `label` changes). If you click A twice (count 2) and flip, you see `B:2`.

If the two `Counter`s are wrapped in **different element types** (`<div>` vs `<section>`), React sees a different tree and **resets** the state: you'd see `B:0`.

To force a reset on purpose, give the component a **`key`**:

```jsx
<Counter key={userId} /> // new key => brand-new component, fresh state
```

## 5. Rendering must be pure

A component function should behave like a **pure function**: same props + state + context in -> same JSX out. During rendering:

- **Don't** mutate variables defined outside the component, props or state.
- **Don't** do side effects (fetch, timers, subscriptions, writing to the DOM). Put them in **event handlers** or **`useEffect`**.
- It's fine to create and modify **local variables** created during that render.

```jsx
// BAD: mutates something outside
let guestCount = 0;
function Guest() {
  guestCount++;
  return <p>Guest #{guestCount}</p>;
}

// GOOD: derive from props
function Guest({ number }) {
  return <p>Guest #{number}</p>;
}
```

### Strict Mode

In development, `<StrictMode>` **renders every component twice** and **runs every effect twice (mount -> unmount -> mount)** to expose impure code. In production it runs once. If your component behaves differently on the 2nd render, it's impure.

```jsx
// with <StrictMode> in development
function C() {
  console.log("render"); // "render" appears twice per render
  useEffect(() => {
    console.log("effect");
    return () => console.log("cleanup");
  }, []);
  return null;
}
// sequence: render, render, effect, cleanup, effect
// (production / no StrictMode:  render, effect)
```

## 6. Batching and "when does it update"

State updates are **queued** and processed together **after your event handler finishes**, in **one render**.

```jsx
function handleClick() {
  setA(1);
  setB(2);
  console.log("still the old values here");
}
// one re-render after the handler ends; also true inside setTimeout / promises (React 18+)
```

## 7. Controlling unnecessary re-renders (only when needed)

Re-rendering is cheap; **measure before optimising** (React DevTools Profiler). Tools, from simplest to most specific:

### 7.1 Structure: move state down, pass children

If only a small part needs the state, put the state in a **small component** so the rest isn't affected. Or pass the expensive part as **`children`**: elements created by a parent that **didn't re-render** keep the same identity, so React reuses them.

```jsx
function Wrapper({ children }) {
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>{n}</button>
      {children}
    </div>
  );
}

function App() {
  return (
    <Wrapper>
      <ExpensiveTree />
    </Wrapper>
  ); // ExpensiveTree does NOT re-render when Wrapper's state changes
}
```

### 7.2 `React.memo`: skip re-rendering when props are unchanged

```jsx
const Row = memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});
```

`memo` compares props **shallowly** (`Object.is` on each prop). A new object, array or function **created inline on every render** is a _new reference_, so `memo` is defeated:

```jsx
<Row onSelect={() => select(id)} /> // new function each time -> Row re-renders anyway
```

Fix with **`useCallback`** (functions) and **`useMemo`** (objects/arrays/expensive values), see `04-hooks.md`.

```jsx
const handleSelect = useCallback((id) => select(id), []);
const options = useMemo(() => ({ dense: true }), []);
<Row onSelect={handleSelect} options={options} />;
```

### 7.3 The React Compiler

React 19 has an optional **React Compiler** (a build plugin) that adds this kind of memoisation **automatically**. Even with it, understanding _why_ components re-render is an interview staple.

## 8. Conditional rendering gotchas

```jsx
{
  count && <Badge />;
} // count = 0  -> renders the number 0
{
  count > 0 && <Badge />;
} // correct
{
  isOpen ? <Panel /> : null;
} // explicit
{
  items.length === 0 && <p>No results</p>;
}
```

`false`, `null`, `undefined` and `""` render nothing, but **`0` and `NaN` render as text**.

## 9. Common mistakes

1. Thinking a re-render means the DOM was rebuilt. (React only changes what differs.)
2. Expecting a child to skip rendering just because its props didn't change (needs `memo`).
3. Changing a normal variable or `ref.current` and expecting the UI to update.
4. Side effects in the render body (fetching, `localStorage.setItem`, random values that change output).
5. Overusing `useMemo`/`useCallback`/`memo` "just in case" (adds complexity, rarely helps).
6. Defining a component **inside** another component: it's a **new component type every render**, so its state resets and DOM is recreated.
   ```jsx
   function Parent() {
     function Child() {
       return <input />;
     } // BAD: new type on each Parent render
     return <Child />;
   }
   ```

## 10. Predict the output

**Q1** How many times do `Plain` and `Memoed` render after **one** click (including the first render)?

```jsx
let plain = 0,
  memoed = 0;
const Plain = () => {
  plain++;
  return <i />;
};
const Memoed = memo(() => {
  memoed++;
  return <i />;
});

function P() {
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>p</button>
      <Plain />
      <Memoed />
    </div>
  );
}
```

**Q2** How many times does `Via` render after one click on "go" (including the first render)?

```jsx
let viaRenders = 0;
const Via = () => {
  viaRenders++;
  return <i />;
};

function Wrapper({ children }) {
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>go</button>
      {n}
      {children}
    </div>
  );
}
function App() {
  return (
    <Wrapper>
      <Via />
    </Wrapper>
  );
}
```

**Q3** After clicking `A:` twice and then "flip", what does the counter show in each version?

```jsx
function Counter({ label }) {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => setN(n + 1)}>
      {label}:{n}
    </button>
  );
}

// Version 1
{
  showA ? <Counter label="A" /> : <Counter label="B" />;
}

// Version 2
{
  showA ? (
    <div>
      <Counter label="A" />
    </div>
  ) : (
    <section>
      <Counter label="B" />
    </section>
  );
}
```

**Q4** What is logged in a **StrictMode** development build on mount?

```jsx
function C() {
  console.log("render");
  useEffect(() => {
    console.log("effect");
    return () => console.log("cleanup");
  }, []);
  return <i />;
}
```

**Q5** What text does this render?

```jsx
<div>
  {0 && <b>x</b>}|{"" && <b>z</b>}|{null}|{false}
</div>
```

## 11. Answers

- **Q1:** `Plain` = **2**, `Memoed` = **1**. The parent re-render re-renders `Plain`; `memo` skips `Memoed` because its props (none) didn't change.
- **Q2:** **1**. `Via` is created by `App`, which doesn't re-render. `Wrapper` re-renders but receives the **same** `children` element, so React reuses it.
- **Q3:** Version 1 shows **`B:2`** (same type, same position: state kept). Version 2 shows **`B:0`** (different parent types: the subtree is replaced and state is reset).
- **Q4:** `render`, `render`, `effect`, `cleanup`, `effect`. (Without StrictMode: `render`, `effect`.)
- **Q5:** `0|||`. The `0` renders as text, while `""`, `null` and `false` render nothing, so only the three literal `|` separators remain next to it.

## Recap

- **Render** = calling your component; **commit** = applying the differences to the DOM. Rendering doesn't always change the DOM.
- Re-render triggers: own state change, parent re-render, context change.
- React diffs by **type and position (and key in lists)**: same type + position keeps state, different type resets it.
- Rendering must be **pure**; side effects go in event handlers or `useEffect`.
- StrictMode doubles renders/effects in development to catch impurity.
- Optimise only when needed: move state down, pass `children`, `memo` + `useCallback`/`useMemo`, or the React Compiler.

## Checklist

- [ ] I can explain trigger -> render -> commit
- [ ] I can list the 3 causes of a re-render
- [ ] I can explain why `memo` can be defeated by inline functions/objects
- [ ] I can explain why state is kept for the same component type in the same position
- [ ] I got Q1 to Q5 right without looking
