# TanStack Query

(Formerly React Query) — manages **server state**: fetching, caching, synchronizing, and updating data from an API. It's not a general state manager like Redux/Zustand — it specifically solves the async data-fetching problem (loading/error states, caching, refetching, deduplication).

```jsx
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfile userId={1} />
    </QueryClientProvider>
  );
}

function UserProfile({ userId }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user", userId], // cache key — auto re-fetches when it changes
    queryFn: () => fetch(`/api/users/${userId}`).then((res) => res.json()),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;
  return <p>{data.name}</p>;
}
```

**Mutations — for creating/updating/deleting data, with cache invalidation:**

```jsx
function AddUserForm() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (newUser) =>
      fetch("/api/users", { method: "POST", body: JSON.stringify(newUser) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // refetch stale data
    },
  });

  return (
    <button onClick={() => mutation.mutate({ name: "Alice" })}>Add User</button>
  );
}
```

**Built-in features that replace hand-rolled logic:** automatic caching, background refetching, deduplication of identical in-flight requests, retry on failure, pagination/infinite scroll helpers (`useInfiniteQuery`), stale-while-revalidate behavior.

**Interview note:** a common modern architecture pairs TanStack Query (for **server** state — API data) with Zustand or Context (for **client/UI** state — theme, modals, form drafts) rather than trying to force Redux to manage both.
