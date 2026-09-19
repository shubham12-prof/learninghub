# Components

Independent, reusable pieces of UI. Modern React almost exclusively uses **function components**.

```jsx
// Function component (standard in modern React)
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Class component (legacy, still seen in older codebases)
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// Usage — components are just functions, composed together
function App() {
  return (
    <div>
      <Welcome name="Alice" />
      <Welcome name="Bob" />
    </div>
  );
}
```

**Composition over inheritance:** React favors building complex UIs by composing small components together (nesting, `children` prop) rather than class inheritance hierarchies.

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
function App() {
  return (
    <Card>
      <h2>Title</h2>
      <p>Some content inside the card</p>
    </Card>
  );
}
```

**Interview note:** function components + Hooks have effectively replaced class components since React 16.8 — expect most interview questions to focus on function components.
