# Error Boundaries

Components that catch JavaScript errors thrown anywhere in their child component tree during rendering, in lifecycle methods, and in constructors — logging the error and rendering a fallback UI instead of crashing the whole app.

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }; // update state so next render shows fallback UI
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
    logErrorToService(error, errorInfo); // report to monitoring (e.g. Sentry)
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong.</h2>;
    }
    return this.props.children;
  }
}

// Usage — wrap around any part of the tree you want isolated
function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

**Important limitations (frequently asked in interviews):** error boundaries do NOT catch errors in:

- Event handlers (use a regular `try/catch` there instead)
- Asynchronous code (`setTimeout`, promises)
- Server-side rendering
- Errors thrown in the error boundary itself

```jsx
function Button() {
  const handleClick = () => {
    try {
      riskyOperation();
    } catch (e) {
      console.error(e); // must handle manually — an ErrorBoundary won't catch this
    }
  };
  return <button onClick={handleClick}>Click</button>;
}
```

**Interview note:** error boundaries currently must be class components — there's no official Hook equivalent (`useErrorBoundary` isn't part of core React), though libraries like `react-error-boundary` provide a hook-friendly wrapper around the same class-based mechanism.
