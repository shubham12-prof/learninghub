# Behavioral Questions & Interview Tips

## Common Follow-Up / Deep-Dive Questions

- "Walk me through what happens from a `setState` call to the screen updating." (state update → re-render triggered → render phase builds new fiber tree → reconciliation diffs it → commit phase applies DOM changes → browser paints → passive effects run)
- "How would you debug a component that's re-rendering too often?" (React DevTools Profiler → check for unstable props/inline objects/functions → check for missing memoization → check for overly broad Context subscriptions)
- "How would you optimize a page rendering a list of 10,000 items?" (virtualization with `react-window`, pagination, memoized row components, avoiding inline handler recreation per row)
- "How do you decide between Context API and Redux/Zustand for a given app?" (frequency of updates, number of consumers, need for DevTools/time-travel debugging, team familiarity)
- "How would you test a component that fetches data on mount?" (RTL's `findBy` queries for async UI, mocking the fetch/API call, asserting loading → success/error states)
- "Explain a bug you fixed related to stale closures or missing dependencies." (be ready with a real or plausible example — interviewers want to see you understand _why_ the bug happened, not just that you fixed it)

## Tips for the Interview

- When asked to predict output, mentally trace the render lifecycle: render phase (pure, no DOM) → commit phase (DOM updates + `useLayoutEffect`) → paint → `useEffect` (async, after paint).
- For "why" questions (why does React batch updates, why do Hooks have rules), tie your answer back to a concrete problem it solves — interviewers are testing understanding, not memorized rules.
- When live-coding a component, narrate your state design first ("I'll need state for X and Y, and I'll derive Z from them") before writing JSX.
- If asked to optimize something, always mention profiling first — jumping straight to `useMemo`/`useCallback` without evidence of a real bottleneck is a common red flag some interviewers watch for.
- Be ready to explain a real tradeoff you've made (e.g., Context vs a state library, controlled vs uncontrolled forms) — practical judgment matters as much as textbook definitions.
