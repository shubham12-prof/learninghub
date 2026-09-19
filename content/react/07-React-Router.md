# React Router

The most widely used routing library for React, providing declarative route definitions as components.

```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  Navigate,
  Outlet,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<UsersLayout />}>
          <Route index element={<UserList />} /> {/* /users */}
          <Route path=":id" element={<UserDetail />} />{" "}
          {/* /users/:id — nested route */}
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} /> {/* catch-all 404 */}
      </Routes>
    </BrowserRouter>
  );
}

function UsersLayout() {
  return (
    <div>
      <h2>Users Section</h2>
      <Outlet />{" "}
      {/* renders the matched nested route (UserList or UserDetail) */}
    </div>
  );
}

function UserDetail() {
  const { id } = useParams(); // read dynamic URL segment
  const navigate = useNavigate(); // programmatic navigation
  return (
    <div>
      <p>User ID: {id}</p>
      <button onClick={() => navigate("/users")}>Back</button>
    </div>
  );
}
```

**Protected routes (redirect if not authenticated):**

```jsx
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

**Reading query params:**

```jsx
import { useSearchParams } from "react-router-dom";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q"); // /search?q=react -> "react"
  return (
    <input
      value={query || ""}
      onChange={(e) => setSearchParams({ q: e.target.value })}
    />
  );
}
```

**Interview note:** `<Link>` and `<NavLink>` render an actual `<a>` tag (good for accessibility/SEO), but intercept the click via JS to avoid a full page reload — `NavLink` additionally provides styling hooks for the "active" route.
