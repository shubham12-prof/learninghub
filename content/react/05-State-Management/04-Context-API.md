# Context API (as a State Management Option)

For smaller apps, or state that changes infrequently (theme, current user, locale), the built-in Context API + `useReducer` can serve as a lightweight state management solution without adding a third-party library.

```jsx
const AppStateContext = createContext();
const AppDispatchContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case "toggleTheme":
      return { ...state, theme: state.theme === "light" ? "dark" : "light" };
    default:
      return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, { theme: "light" });
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
```

Splitting state and dispatch into two separate contexts means components that only need to _dispatch_ actions (and never read state) won't re-render when state changes — a common performance pattern.

**When Context API is enough vs when you need a library:**

| Scenario                                                          | Recommendation                          |
| ----------------------------------------------------------------- | --------------------------------------- |
| Small app, infrequent global state changes (theme, auth)          | Context + useReducer is sufficient      |
| Large app, frequent updates, complex derived state, need DevTools | Redux Toolkit or Zustand                |
| Primarily server/API data                                         | TanStack Query (regardless of app size) |

**Interview note:** the deciding factor isn't app size alone — it's **update frequency** and **how many components consume the value**. High-frequency updates through Context cause broad re-render cascades since Context has no built-in selector/slicing mechanism (unlike Redux's `useSelector` or Zustand's selector functions).
