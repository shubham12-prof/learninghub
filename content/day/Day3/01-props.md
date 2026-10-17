# 01 - Props

> **Time to learn:** ~30 min | **Level:** Fundamentals | **Interview frequency:** Very high

## 1. What are props?

**Props** (short for *properties*) are the **inputs of a component**. A component is just a JavaScript function, and props are the **single object argument** it receives.

```jsx
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}

<Greeting name="Asha" />   // props = { name: "Asha" }
```

You almost always **destructure** them in the parameter list:

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

Three rules to remember:

1. Data flows **one way**: from **parent to child**.
2. Props are **read-only**. A component must **never change its own props**.
3. When a parent passes **new props**, the child **re-renders** with them.

## 2. Analogy

Props are the **ingredients and instructions on an order form**. The kitchen (the child component) cooks exactly what the form says, but it is not allowed to rewrite the form. If the customer (the parent) hands over a new form, the kitchen simply cooks again.

## 3. Examples

### 3.1 Passing different kinds of values

```jsx
function CourseCard({ title, hours, isNew, tags, instructor, onEnroll }) {
  return (
    <article>
      <h2>{title} {isNew && <span>NEW</span>}</h2>
      <p>{hours} hours by {instructor.name}</p>
      <p>Tags: {tags.join(", ")}</p>
      <button onClick={() => onEnroll(title)}>Enroll</button>
    </article>
  );
}

<CourseCard
  title="React Basics"            // string: quotes
  hours={12}                      // number: curly braces
  isNew                           // boolean shorthand: isNew={true}
  tags={["react", "frontend"]}    // array
  instructor={{ name: "Ravi" }}   // object (double braces: braces for JS + braces for the object)
  onEnroll={(t) => alert(t)}      // function
/>
```

Rule: **strings** can use quotes, **everything else** goes inside `{ }`.

### 3.2 Default values

Use normal JavaScript default parameter values:

```jsx
function Button({ label = "Click me", variant = "primary" }) {
  return <button className={variant}>{label}</button>;
}

<Button />                      // Click me, primary
<Button label="Save" />         // Save, primary
```

(`Component.defaultProps` is **no longer supported on function components in React 19**, so use default values like above.)

### 3.3 The special `children` prop

Whatever you put **between** the opening and closing tags arrives as `props.children`. This is how you build wrappers and layouts.

```jsx
function Card({ title, children }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

<Card title="Next lesson">
  <p>Closures in depth</p>
  <button>Start</button>
</Card>
```

### 3.4 Child talks to parent: callback props

Data goes **down** as props. To send something **up**, the parent passes a **function** and the child **calls** it.

```jsx
function Parent() {
  const [liked, setLiked] = useState(false);

  return (
    <div>
      <p>{liked ? "Liked" : "Not liked"}</p>
      <LikeButton onToggle={() => setLiked(!liked)} />
    </div>
  );
}

function LikeButton({ onToggle }) {
  return <button onClick={onToggle}>Toggle</button>;
}
```

Naming convention: props that take functions start with **`on`** (`onToggle`, `onSelect`), and the handler functions inside the parent start with **`handle`** (`handleToggle`).

### 3.5 Spreading props

```jsx
const buttonProps = { type: "submit", disabled: false, "aria-label": "Send" };

<button {...buttonProps}>Send</button>
```

Useful for wrapper components (`<MyInput {...rest} />`), but don't spread blindly: you can forward props you didn't intend to.

### 3.6 `key` and `ref`

`key` is **not** a prop you can read. React uses it internally to identify list items (see `09-interview-keys-rerendering.md`). In **React 19**, `ref` **is** a normal prop for function components:

```jsx
function FancyInput({ ref, ...rest }) {
  return <input ref={ref} {...rest} />;
}
```

(In React 18 and earlier you needed `forwardRef`.)

## 4. Props are read-only

```jsx
function Bad(props) {
  props.name = "Changed";          // WRONG: React freezes props in development
  return <p>{props.name}</p>;      // TypeError: Cannot assign to read only property 'name'
}
```

If a component needs to change a value over time, that value should be **state** (see `02-state.md`), not a prop. If you need a modified *copy* for display, compute it inside the component:

```jsx
function Title({ text }) {
  const shout = text.toUpperCase();   // fine: a new value, the prop is untouched
  return <h1>{shout}</h1>;
}
```

## 5. Props vs state

| | **Props** | **State** |
|---|---|---|
| Owned by | the **parent** | the **component itself** |
| Can the component change it? | **No** (read-only) | **Yes** (via the setter) |
| Changing it re-renders | the child (when the parent passes new ones) | the component |
| Used for | configuring a component | data that changes over time (input text, open/closed, counters) |

A value can be **state in the parent** and **a prop in the child** at the same time. That is the whole idea of *lifting state up*.

## 6. Prop drilling and composition

**Prop drilling** = passing a prop through many layers that don't use it:

```jsx
<App user={user}>          // App doesn't use user
  <Layout user={user}>     // Layout doesn't use user
    <Sidebar user={user}>  // Sidebar doesn't use user
      <Avatar user={user} />   // only this one does
```

Fixes, in order of preference:

1. **Composition**: pass the finished element down as `children` (or a prop) so the middle layers don't need to know about it:
   ```jsx
   <Layout sidebar={<Avatar user={user} />} />
   ```
2. **Context** (`useContext`) for data many components need (theme, current user, language).
3. A state library, only for large apps.

## 7. Common mistakes

1. **Mutating props** (`props.items.push(x)` also mutates the parent's array!).
2. **Copying a prop into state** (`useState(props.value)`) and then expecting the state to follow the prop. The state only reads the prop **once**, on the first render.
3. Writing `onClick={handleClick()}` (calls it **during render**) instead of `onClick={handleClick}` or `onClick={() => handleClick(id)}`.
4. Forgetting `{ }` for non-string values (`hours="12"` passes the **string** `"12"`, not the number).
5. Using `{count && <Badge />}` when `count` can be `0`: React renders the number `0`. Use `{count > 0 && <Badge />}`.
6. Prop drilling through 5 levels when composition or context would be cleaner.

## 8. Predict the output

**Q1**
```jsx
function Item({ label, done = false }) {
  return <li>{label}: {done ? "done" : "todo"}</li>;
}
<ul>
  <Item label="Read" done />
  <Item label="Write" />
</ul>
```

**Q2**
```jsx
function Box({ children }) {
  return <div>[{children}]</div>;
}
<Box>A</Box>
<Box />
```

**Q3**
```jsx
function Badge({ count }) {
  return <div>{count && <b>{count}</b>}</div>;
}
<Badge count={0} />
```

**Q4**
```jsx
function Bad(props) {
  props.name = "Changed";
  return <p>{props.name}</p>;
}
<Bad name="Asha" />
```
(Development build.)

**Q5**
```jsx
function Child({ onPick }) {
  return <button onClick={() => onPick("react")}>pick</button>;
}
function Parent() {
  const [choice, setChoice] = useState("none");
  return <div><Child onPick={setChoice} /><p>{choice}</p></div>;
}
```
What does the `<p>` show after clicking the button?

## 9. Answers

- **Q1:** `Read: done` and `Write: todo`. `done` alone means `done={true}`, and the default `false` applies when it's missing.
- **Q2:** `[A]` and `[]`. A missing `children` is `undefined`, which renders nothing.
- **Q3:** `0`. `0 && ...` evaluates to `0`, and React renders the number. Fix: `count > 0 && ...`.
- **Q4:** It throws `TypeError: Cannot assign to read only property 'name' of object` in development, because the props object is frozen. Never write to props.
- **Q5:** `react`. The parent passes its state setter down as a callback; the child calls it with a value, which updates the parent's state.

## Recap

- Props = the single input object of a component, **read-only**, flowing **parent -> child**.
- Destructure them, use default parameter values, and use `children` for wrappers.
- To talk **upward**, pass a **callback prop** (`onSomething`).
- Props change -> the child re-renders; state is what a component owns and changes itself.
- Avoid prop drilling with composition first, context second.
- In React 19, `ref` is a normal prop for function components.

## Checklist

- [ ] I can explain props vs state in one sentence
- [ ] I can pass a function prop and call it from the child
- [ ] I can explain why `{count && <X />}` can print `0`
- [ ] I know why mutating props is wrong
- [ ] I got Q1 to Q5 right without looking
