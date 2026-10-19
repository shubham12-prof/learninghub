# 03 - Component Composition

> **Time to learn:** ~35 min | **Level:** Core concept | **Interview frequency:** High
> Composition is React's main tool for **reuse** and also the **cheapest performance fix**.

## 1. What is composition?

**Composition = building bigger components by combining smaller ones**, passing content and behaviour in through props (especially `children`), instead of one giant component or class inheritance. React's official advice: _"use composition instead of inheritance"_.

## 2. Analogy

LEGO. A `Card` is a flat brick with studs on top: **it doesn't care what you click onto it** (text, an image, a button). You get many different models from the same few bricks.

## 3. The `children` prop

Anything you put between the opening and closing tag arrives as `props.children`.

```jsx
function Card({ children }) {
  return <section className="card">{children}</section>;
}

<Card>
  <h2>React basics</h2>
  <p>6 hours</p>
  <button>Enroll</button>
</Card>;
```

`Card` knows nothing about what is inside. It only provides the **box** (layout, border, padding).

## 4. Slots: several holes, named props

When one `children` isn't enough, pass elements through **named props**:

```jsx
function Card({ media, title, actions, children }) {
  return (
    <article className="card">
      {media && <div className="card-media">{media}</div>}
      <div className="card-body">
        <h3>{title}</h3>
        {children}
      </div>
      {actions && <footer className="card-actions">{actions}</footer>}
    </article>
  );
}

<Card
  media={<img src="/react.png" alt="" />}
  title="React basics"
  actions={<button>Enroll</button>}
>
  <p>6 hours, beginner</p>
</Card>;
```

This is the **"slots" pattern**. The parent decides _what_ goes in each slot; `Card` decides _where_.

## 5. Specialisation: a specific component built from a general one

```jsx
function Alert({ tone = "info", children }) {
  return (
    <div role="alert" className={`alert alert-${tone}`}>
      {children}
    </div>
  );
}

function ErrorAlert({ children }) {
  return <Alert tone="error">{children}</Alert>; // a "special case" of Alert, no inheritance
}
```

## 6. Composition kills prop drilling

**Prop drilling** = passing a prop through many components that don't use it.

```jsx
// Drilling: Layout and Sidebar only forward `user`
<Layout user={user}>  ->  <Sidebar user={user}>  ->  <Avatar user={user} />
```

Fix by **composing at the top** and passing the _finished element_ down:

```jsx
function Page({ user }) {
  return <Layout sidebar={<Avatar user={user} />} />; // Layout never sees `user`
}
function Layout({ sidebar }) {
  return (
    <div className="layout">
      <aside>{sidebar}</aside>
    </div>
  );
}
```

(Another fix is **context**, `04-hooks.md` in Day 3. Use composition first; reach for context when many distant components need the value.)

## 7. Composition as a performance tool

### 7.1 Move state down

```jsx
// BEFORE: typing re-renders the whole page, including the slow list
function Page() {
  const [text, setText] = useState("");
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <SlowList /> // re-renders on every keystroke
    </>
  );
}

// AFTER: the state lives in a small component; Page itself never re-renders
function TextBox() {
  const [text, setText] = useState("");
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}
function Page() {
  return (
    <>
      <TextBox />
      <SlowList /> // not a child of the component whose state changes
    </>
  );
}
```

### 7.2 Lift content up (children trick)

```jsx
function Tracker({ children }) {
  const [x, setX] = useState(0);
  return (
    <div onMouseMove={(e) => setX(e.clientX)}>
      x = {x}
      {children}
    </div>
  );
}

function Page() {
  return (
    <Tracker>
      <SlowList />
    </Tracker>
  ); // SlowList is created by Page, which doesn't re-render
}
```

When `Tracker`'s state changes it re-renders, but `children` is the **same element object** that `Page` created earlier, so React sees the identical element and **skips** `SlowList`. No `memo` needed.

**Caveat:** this only works if the element is created by a component that **doesn't re-render**. If `Page` itself re-renders, a new `<SlowList />` element is created.

## 8. Other composition patterns (know the names)

| Pattern                        | Idea                                                                                              | Example                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Container / presentational** | One component fetches/holds state; another only renders                                           | `UserListContainer` -> `UserList`                                |
| **Compound components**        | Parts that work together through shared (context) state                                           | `<Tabs><Tabs.List/><Tabs.Panel/></Tabs>`, your Day 3 `Accordion` |
| **Render props**               | A prop that is a **function returning JSX**                                                       | `<List renderItem={(c) => <CourseCard course={c} />} />`         |
| **Custom hooks**               | Reuse **logic** (not UI)                                                                          | `useDebounce`, `useToggle`                                       |
| **Higher-order components**    | A function that takes a component and returns a new one (older pattern; mostly replaced by hooks) | `withAuth(Page)`                                                 |

### Render prop example

```jsx
function List({ items, renderItem }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

<List items={courses} renderItem={(c) => <strong>{c.title}</strong>} />;
```

The list owns **iteration**; the caller owns **how an item looks**.

## 9. Why not inheritance?

In React you almost never extend one component from another. Composition already gives you reuse with explicit, visible inputs (props) and no hidden coupling to a parent class.

## 10. Common mistakes

1. Giant components that do layout, data and styling together (hard to reuse and re-render as one unit).
2. Over-engineering: creating a `Wrapper` for everything. Compose where there's real reuse or real pain.
3. Prop-drilling the same value through 4 layers instead of composing or using context.
4. Defining a component **inside** another component (new type each render, state resets).
5. Expecting the children trick to work when the parent that creates `children` is the one re-rendering.
6. Passing `children` to a `memo` component and wondering why it never skips (`01-memoization.md`).

## 11. Predict the output

Use this counter (no StrictMode):

```jsx
let slow = 0;
function SlowList() {
  slow++;
  return (
    <ul>
      <li>row</li>
    </ul>
  );
}
```

**Q1** After the first render and typing 3 characters into the input, what is `slow`?

```jsx
function Page() {
  const [text, setText] = useState("");
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <SlowList />
    </>
  );
}
```

**Q2** After the first render and typing 3 characters, what is `slow`?

```jsx
function TextBox() {
  const [text, setText] = useState("");
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}
function Page() {
  return (
    <>
      <TextBox />
      <SlowList />
    </>
  );
}
```

**Q3** After the first render and 2 clicks, what is `slow`?

```jsx
function Tracker({ children }) {
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>{n}</button>
      {children}
    </div>
  );
}
function Page() {
  return (
    <Tracker>
      <SlowList />
    </Tracker>
  );
}
```

**Q4** Same as Q3, but the `Page` is `function Page() { const [t, setT] = useState(0); return <Tracker><SlowList /></Tracker>; }` and **Page's** state is what changes (a button in `Page` calls `setT(t + 1)`). What is `slow` after the first render and 2 clicks on that button?

**Q5** What does `<Card title="A" actions={<b>go</b>}><p>body</p></Card>` render, using the slot `Card` from section 4 with `media` omitted? (List the elements in order.)

## 12. Answers

- **Q1:** `slow` = **4** (first render + 3 keystrokes). `SlowList` is a child of the component whose state changes.
- **Q2:** `slow` = **1**. The state lives in `TextBox`; `Page` never re-renders, so `SlowList` isn't touched.
- **Q3:** `slow` = **1**. `Tracker` re-renders but receives the **same** `SlowList` element created once by `Page`.
- **Q4:** `slow` = **3** (first render + 2). `Page` re-renders and creates a **new** `<SlowList />` element each time; without `memo`, it renders again.
- **Q5:** `<article>`: a `div.card-body` containing `<h3>A</h3>` and `<p>body</p>`, then a `<footer class="card-actions">` containing `<b>go</b>`. (No media div, because `media` is falsy.)

## Recap

- Composition = combine small components via `children`, **slots** (named props) and render props. No inheritance.
- Composition removes **prop drilling** and keeps components **reusable**.
- **Move state down** and **lift content up** to avoid re-renders for free; use `memo` only afterwards.
- The children trick works only when the component creating the element **doesn't re-render**.

## Checklist

- [ ] I can write a `Card` with `children` and one named slot
- [ ] I can explain prop drilling and 2 ways to fix it
- [ ] I can explain "move state down" and "children as a prop" for performance
- [ ] I can name 3 composition patterns (compound, render props, custom hooks)
- [ ] I got Q1 to Q5 right without looking
