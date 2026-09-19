# Forms

React forms are typically **controlled components** — form data is held in React state, and the input's value is driven by that state (single source of truth).

```jsx
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email} // controlled — value comes from state
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

**Controlled vs Uncontrolled:**

```jsx
// Uncontrolled — DOM holds the value, accessed via a ref, not React state
function UncontrolledForm() {
  const inputRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

|                      | Controlled  | Uncontrolled                     |
| -------------------- | ----------- | -------------------------------- |
| Source of truth      | React state | the DOM itself                   |
| Real-time validation | easy        | harder                           |
| Boilerplate          | more        | less                             |
| Common use           | most forms  | file inputs, simple/legacy forms |

**Interview note:** file inputs (`<input type="file">`) are always uncontrolled — the browser manages that value for security reasons; you must use a ref to read the selected file(s).
