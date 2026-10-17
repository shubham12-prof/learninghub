# 05 - Controlled Components (Forms)

> **Time to learn:** ~40 min | **Level:** Core concept | **Interview frequency:** Very high

## 1. What is a controlled component?

A **controlled component** is a form element whose **value is owned by React state**. The input **displays** the state, and every keystroke **updates** the state.

```jsx
function NameForm() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}                              // 1. React decides what the input shows
      onChange={(e) => setName(e.target.value)} // 2. every change goes back into state
    />
  );
}
```

The loop is: **user types -> `onChange` fires -> `setName` -> re-render -> input shows the new `value`**. React is the **single source of truth**.

An **uncontrolled component** lets the **DOM** keep the value; you read it only when you need it (via a `ref` or `FormData`).

```jsx
function Uncontrolled() {
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    console.log(inputRef.current.value);            // read the DOM when needed
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="Asha" />  {/* defaultValue = initial value only */}
      <button>Save</button>
    </form>
  );
}
```

## 2. Analogy

A **controlled** input is a puppet: React holds the strings (state) and the puppet only shows what it is told. An **uncontrolled** input is a free person: they hold their own value and you ask them for it when you need it.

## 3. Controlled vs uncontrolled

| | **Controlled** | **Uncontrolled** |
|---|---|---|
| Where the value lives | React **state** | the **DOM** |
| Props | `value` + `onChange` | `defaultValue` (+ `ref`) |
| Re-renders on each keystroke | Yes | No |
| Instant validation / formatting / disabling a button | Easy | Harder |
| Reading the value | any time (it's state) | when you ask (`ref.current.value` / `FormData`) |
| Good for | most forms, live search, validation | simple forms, file inputs, integrating non-React code |

## 4. Every input type

```jsx
function AllInputs() {
  const [text, setText] = useState("");
  const [bio, setBio] = useState("");
  const [level, setLevel] = useState("beginner");
  const [agree, setAgree] = useState(false);
  const [plan, setPlan] = useState("free");

  return (
    <form>
      {/* text / textarea / select all use value + onChange */}
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} />   {/* value, NOT children */}
      <select value={level} onChange={(e) => setLevel(e.target.value)}>   {/* value on <select>, NOT selected on <option> */}
        <option value="beginner">Beginner</option>
        <option value="advanced">Advanced</option>
      </select>

      {/* checkbox uses `checked` and e.target.checked */}
      <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />

      {/* radio: `checked` compares with state */}
      <input type="radio" name="plan" value="free" checked={plan === "free"} onChange={(e) => setPlan(e.target.value)} />
      <input type="radio" name="plan" value="pro"  checked={plan === "pro"}  onChange={(e) => setPlan(e.target.value)} />
    </form>
  );
}
```

| Element | Controlled with | Read from the event |
|---|---|---|
| `<input type="text">`, `<textarea>`, `<select>` | `value` | `e.target.value` |
| `<input type="checkbox">` | `checked` | `e.target.checked` |
| `<input type="radio">` | `checked={state === thisValue}` | `e.target.value` |
| `<input type="file">` | **always uncontrolled** (read `e.target.files`) | `e.target.files` |

## 5. One state object + one handler for many fields

Use the input's **`name`** attribute so one handler serves every field:

```jsx
function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", level: "beginner", newsletter: false });

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));   // [name] = computed key
  }

  function handleSubmit(e) {
    e.preventDefault();                  // stop the browser from reloading the page
    console.log("Submitting", form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <select name="level" value={form.level} onChange={handleChange}>
        <option value="beginner">Beginner</option>
        <option value="advanced">Advanced</option>
      </select>
      <label>
        <input name="newsletter" type="checkbox" checked={form.newsletter} onChange={handleChange} />
        Newsletter
      </label>
      <button type="submit">Join</button>
    </form>
  );
}
```

## 6. Validation and derived UI

Because the value is in state, you can **derive** errors and button state **during render** (no extra state, no effect):

```jsx
function EmailField() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const error = !email.includes("@") ? "Enter a valid email" : "";
  const showError = touched && error;

  return (
    <>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}          // only complain after the user leaves the field
        aria-invalid={Boolean(showError)}
      />
      {showError && <p role="alert">{error}</p>}
      <button disabled={Boolean(error)}>Send</button>
    </>
  );
}
```

Transforming input while typing is also easy:

```jsx
<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} />
```

## 7. Uncontrolled with `FormData` (React 19 style)

For simple forms you can skip state entirely:

```jsx
function QuickForm() {
  function handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));   // { name: "...", email: "..." }
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue="" />
      <input name="email" type="email" defaultValue="" />
      <button>Send</button>
    </form>
  );
}
```

(React 19 also supports passing a function to `<form action={...}>`; the idea is the same.)

## 8. Warnings you will see

```jsx
<input value="x" />
```

> Warning: You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.

- A `value` **without** `onChange` makes a **read-only** input.
- **Don't switch** between controlled and uncontrolled (`value={undefined}` first, a string later): initialise state with `""`, never `undefined`/`null`.

## 9. Common mistakes

1. `value` without `onChange` (frozen, un-typeable input).
2. Initial state `undefined` or `null` -> "changing an uncontrolled input to be controlled".
3. Forgetting `e.preventDefault()` in `onSubmit` (the page reloads).
4. Using `e.target.value` for a checkbox (use `checked`).
5. Putting text inside `<textarea>` as children or `selected` on `<option>` (use `value`).
6. Mutating the form object in state (`form.name = ...`).
7. Using `<label>` without associating it: `<label htmlFor="id">` + `<input id="id" />`, or wrap the input inside the label.
8. Storing **derived** values (like `isValid` or `filteredList`) in separate state.

## 10. Predict the output

**Q1** What can the user do with this input?
```jsx
<input value="fixed" />
```

**Q2** After typing `ab` into this input, what does `<p>` show?
```jsx
function F() {
  const [t, setT] = useState("");
  return (<><input aria-label="t" value={t} onChange={(e) => setT(e.target.value.toUpperCase())} /><p>{t}</p></>);
}
```

**Q3** What is the checkbox's state after one click, starting unchecked?
```jsx
const [on, setOn] = useState(false);
<input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
```

**Q4** In `handleChange` from section 5, what does this line do when the user types in the **email** field?
```jsx
setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
```

**Q5** Why is the `QuickForm` submit data **not** affected by typing in a way that causes re-renders?

## 11. Answers

- **Q1:** Nothing: it is **read-only** (React warns about `value` without `onChange`). Use `defaultValue="fixed"` for an editable input.
- **Q2:** `AB`. The handler transforms the text before storing it, and the input then displays the transformed state.
- **Q3:** `true`, and the box is checked. With a controlled checkbox you read **`e.target.checked`**.
- **Q4:** It copies all existing fields and sets only `email` to the new text, because `[name]` is a **computed property key** (`name` is `"email"`). The other fields are unchanged.
- **Q5:** Because it's **uncontrolled**: the DOM holds the values, React doesn't store them, so typing doesn't call any setter and doesn't re-render. The values are read only on submit with `FormData`.

## Recap

- **Controlled:** `value`/`checked` + `onChange`, state is the single source of truth, and you can validate, transform and disable in real time.
- **Uncontrolled:** `defaultValue` + `ref`/`FormData`, the DOM owns the value; simpler but less control. File inputs are always uncontrolled.
- One state object + `name` + `[name]: value` gives one handler for many fields.
- Always `preventDefault()` on submit; initialise state with `""`, not `undefined`.
- Derive validation and button state during render instead of storing them.

## Checklist

- [ ] I can explain controlled vs uncontrolled in one sentence each
- [ ] I can build a form with text, select and checkbox using one handler
- [ ] I know the `value without onChange` warning and its fixes
- [ ] I can explain when an uncontrolled input is the better choice
- [ ] I got Q1 to Q5 right without looking
