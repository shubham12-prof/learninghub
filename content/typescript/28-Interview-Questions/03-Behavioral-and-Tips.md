# Behavioral Questions & Interview Tips

## Common Follow-Up / Deep-Dive Questions

- "Walk me through how you'd type an API response whose shape you don't fully trust." (type it as `unknown`, write a type guard/validation function — or use a runtime schema library like Zod — narrow before use)
- "How would you migrate a large JS codebase to TypeScript incrementally?" (enable `allowJs`, add types file-by-file, start with `strict: false` and tighten flags progressively, use `any` sparingly as a temporary bridge, not a permanent pattern)
- "Explain a bug that TypeScript's type system helped you catch before it hit production." (be ready with a concrete, specific example — interviewers want evidence of practical experience, not just definitions)
- "When would you choose `type` over `interface`, or vice versa, on a real team?" (discuss unions/intersections needing `type`, declaration merging favoring `interface` for public APIs, and note many teams just pick one convention for consistency)
- "How do you handle a third-party JS library with no type definitions?" (check for a `@types/*` package first; if none exists, write a minimal ambient `declare module` block covering just what you use)
- "What's your approach to keeping derived types in sync with their source (e.g., a function's return type)?" (favor deriving with `ReturnType`/`Pick`/`Omit` over manually re-declaring duplicate shapes, which can drift out of sync)

## Tips for the Interview

- For "what's the difference between X and Y" type questions (interface vs type, unknown vs any, union vs intersection), always give a concrete code example alongside the definition — it demonstrates real understanding, not memorization.
- When asked to design types for a feature, start from the DATA shape (what does an API response or form actually look like) and derive utility types (`Pick`, `Omit`, `Partial`) from one canonical source type, rather than hand-writing many overlapping interfaces.
- If asked about `strict: true`, be ready to name at least 2-3 of the specific flags it bundles (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`) and what each one catches.
- Remember: TypeScript's guarantees are compile-time only — a good answer to "is this fully safe?" acknowledges that data crossing a true runtime boundary (API calls, `JSON.parse`, user input) still needs runtime validation, not just a type annotation.
