# Context API

React's built-in mechanism for sharing data across a component tree without manually passing props through every intermediate level ("prop drilling").

```jsx
import { createContext, useContext, useState } from "react";

// 1. Create a context
const AuthContext = createContext(null);

// 2. Provide it at the top of the relevant tree
function App() {
  const [user, setUser] = useState(null);
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Dashboard />
    </AuthContext.Provider>
  );
}

// 3. Consume it anywhere below, no matter how deeply nested
function Dashboard() {
  return <Navbar />; // Navbar doesn't need auth props passed to it
}
function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return user ? <button onClick={logout}>Logout, {user.name}</button> : null;
}
```

**Custom hook wrapper (common best practice):**

```jsx
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
```

**Performance caveat:** every component consuming a context re-renders when the Provider's `value` changes, even if that component only uses part of it. Mitigate by:

- Splitting one large context into several smaller, focused contexts
- Memoizing the value object with `useMemo`
- Using a dedicated state library (Redux Toolkit, Zustand) for high-frequency updates

**Interview note:** Context is designed for **low-frequency, broadly-needed data** (theme, auth, locale) — not as a full replacement for state management libraries in apps with complex, frequently-updating global state.
