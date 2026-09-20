# Required

The opposite of `Partial` — makes all properties of a type **mandatory**, even ones that were originally declared optional.

```ts
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>;
// equivalent to: { host: string; port: number; debug: boolean }

function startServer(config: RequiredConfig) {
  // every field is guaranteed to be present — no need for fallback/default checks
  console.log(`Starting on ${config.host}:${config.port}`);
}

// startServer({ host: "localhost" }); // ❌ missing 'port' and 'debug'
startServer({ host: "localhost", port: 3000, debug: false }); // ✅
```

**How it's implemented internally (removes the `?` modifier via `-?`):**

```ts
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};
```

**Common real-world pattern — enforcing that a fully-resolved config object has no missing optional fields, after applying defaults:**

```ts
interface Options {
  timeout?: number;
  retries?: number;
}
const defaults: Required<Options> = { timeout: 5000, retries: 3 };

function resolveOptions(options: Options): Required<Options> {
  return { ...defaults, ...options };
}
```

**Interview note:** `Partial` and `Required` are inverses of each other — a common interview follow-up is "how would you implement `Required` yourself?" (answer: a mapped type using the `-?` modifier to strip optionality, as shown above).
