# useContext

Reads a value from the nearest matching `Context.Provider` above in the tree, avoiding prop drilling.

```jsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light"); // default value

function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />; // no need to pass theme through props manually
}

function ThemedButton() {
  const theme = useContext(ThemeContext); // reads directly, skipping intermediate components
  return <button className={theme}>Click</button>;
}
```

**Common pattern — pairing Context with useReducer for shared state:**

```jsx
const CartContext = createContext();

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

function useCart() {
  return useContext(CartContext); // custom hook wrapper for convenience
}
```

**Interview note:** every component consuming a context re-renders whenever the Provider's `value` changes — even if it only cares about part of that value. Split contexts by concern, or memoize the value object, to avoid unnecessary re-renders.
