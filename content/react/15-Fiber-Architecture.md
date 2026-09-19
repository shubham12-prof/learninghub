# Fiber Architecture

React's internal reconciliation engine (rewritten from the ground up in React 16), which reimplemented the reconciliation algorithm to support **incremental, interruptible rendering** — a prerequisite for features like Concurrent Rendering, Suspense, and `useTransition`.

**The core problem Fiber solves:** the pre-Fiber ("Stack") reconciler walked the component tree recursively and synchronously — once started, a render couldn't be paused, so a large tree update could block the main thread long enough to cause visible jank (dropped frames, unresponsive input).

**How Fiber changes this:** each component instance gets a corresponding "fiber" — a JS object representing a unit of work, linked to its parent, siblings, and children (like a linked-list tree, not a recursive call stack). React can process one fiber, then yield control back to the browser (to handle input, painting, etc.), then resume from where it left off.

```
Fiber node (simplified shape):
{
  type: 'div',
  key: null,
  child: <fiber>,       // first child
  sibling: <fiber>,      // next sibling
  return: <fiber>,        // parent
  pendingProps: {...},
  memoizedState: {...},    // hooks state lives here
  effectTag: 'UPDATE',       // what DOM operation is needed
}
```

**Two phases:**

1. **Render/Reconciliation phase** — building the new fiber tree, diffing against the old one. This is now **interruptible** — React can pause, abort, or restart it in response to higher-priority work.
2. **Commit phase** — actually applying changes to the real DOM. This phase is always synchronous and cannot be interrupted (to avoid showing a half-updated UI).

**Interview note:** you're rarely expected to implement Fiber internals, but interviewers often ask "why was Fiber introduced?" — the answer is: to enable prioritized, interruptible rendering so React can keep the UI responsive during expensive updates, which is the foundation for Concurrent Rendering, Suspense, and hooks like `useTransition`/`useDeferredValue`.
