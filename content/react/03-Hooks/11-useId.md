# useId

Generates a stable, unique ID string, consistent between server and client renders — solves the "hydration mismatch" problem that occurs if you generate IDs with `Math.random()` or an incrementing counter (which produce different values on server vs. client).

```jsx
import { useId } from "react";

function EmailField() {
  const id = useId(); // e.g. ":r0:" — unique per component instance
  return (
    <>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" />
    </>
  );
}
```

**Multiple related IDs from one call:**

```jsx
function Form() {
  const id = useId();
  return (
    <>
      <label htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} />
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} />
    </>
  );
}
```

**Interview note:** `useId` is NOT meant for generating keys in a list (`key={useId()}` inside `.map()` is a misuse — keys should come from stable data). It's specifically for accessibility attributes (`htmlFor`/`id` pairs, `aria-describedby`, etc.) where uniqueness and server/client consistency matter.
