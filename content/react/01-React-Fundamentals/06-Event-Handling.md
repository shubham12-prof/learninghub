# Event Handling

React wraps native DOM events in a cross-browser **SyntheticEvent** wrapper, normalizing behavior across browsers, while still giving access to the underlying native event via `e.nativeEvent`.

```jsx
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault(); // stops default form submission/page reload
    console.log("Submitted");
  };

  const handleChange = (e) => {
    console.log(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

```jsx
// Passing arguments to a handler
function List({ items, onDelete }) {
  return items.map((item) => (
    <li key={item.id}>
      {item.name}
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </li>
  ));
}
```

**Event delegation under the hood:** React attaches a single listener at the root of the app (not on every individual element) and uses event bubbling internally to dispatch to the right SyntheticEvent handler — for performance.

**Interview note:** event handler names use camelCase (`onClick`, not `onclick`), and you pass a function reference, not a string (`onClick={handleClick}`, not `onClick="handleClick()"`).
