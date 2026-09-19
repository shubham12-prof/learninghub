# Component Lifecycle

The stages a component goes through: **Mounting** (created, inserted into the DOM) → **Updating** (re-rendered due to prop/state changes) → **Unmounting** (removed from the DOM).

**Class component lifecycle methods (legacy, but still asked about):**

```jsx
class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null };
  }

  componentDidMount() {
    // Mounting — runs once, right after the component is inserted into the DOM.
    // Ideal for: data fetching, subscriptions, DOM measurements.
    fetchData().then((data) => this.setState({ data }));
  }

  componentDidUpdate(prevProps, prevState) {
    // Updating — runs after every re-render (except the first).
    // Always compare with previous props/state to avoid infinite loops.
    if (prevProps.userId !== this.props.userId) {
      fetchData(this.props.userId).then((data) => this.setState({ data }));
    }
  }

  componentWillUnmount() {
    // Unmounting — runs right before removal. Cleanup: cancel timers,
    // unsubscribe from sockets/listeners, abort pending requests.
    clearInterval(this.timer);
  }

  render() {
    return <div>{this.state.data}</div>;
  }
}
```

**Function component equivalent — the `useEffect` Hook maps to all three phases:**

```jsx
function Profile({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Mounting + Updating (runs after every render where userId changed)
    fetchData(userId).then(setData);

    return () => {
      // Unmounting + before next effect run — cleanup
      console.log("cleanup");
    };
  }, [userId]); // dependency array controls when this re-runs

  return <div>{data}</div>;
}
```

| Class method         | Hook equivalent                          |
| -------------------- | ---------------------------------------- |
| constructor          | useState initial value                   |
| componentDidMount    | useEffect(fn, [])                        |
| componentDidUpdate   | useEffect(fn, [deps])                    |
| componentWillUnmount | useEffect's cleanup function (return fn) |

**Interview note:** Hooks unify these three lifecycle concepts into one mental model — "synchronize with an external system" — rather than three separate methods to keep in sync manually.
