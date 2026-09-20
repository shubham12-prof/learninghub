# Memory Optimization

## 1. Why Memory Optimization Matters

Excessive memory usage causes garbage collection pauses (jank), crashes (out-of-memory errors), slower performance on low-end devices, and — for backend services — higher infrastructure costs and potential process crashes under load.

## 2. Memory Leaks in JavaScript (Browser/Node.js)

### a) Uncleared Timers/Intervals

```js
// BAD: interval keeps running and holding references even after component unmounts
function startPolling() {
  setInterval(() => fetchData(), 1000);
}

// GOOD: clean up
function startPolling() {
  const id = setInterval(() => fetchData(), 1000);
  return () => clearInterval(id);
}

// React example
useEffect(() => {
  const id = setInterval(() => fetchData(), 1000);
  return () => clearInterval(id); // cleanup on unmount
}, []);
```

### b) Detached DOM Nodes

```js
// BAD: JS still references a DOM node removed from the tree, preventing GC
let cachedElement = document.getElementById("modal");
document.body.removeChild(cachedElement);
// cachedElement still references the node -> memory leak until reassigned

// GOOD: null out references when done
cachedElement = null;
```

### c) Uncleared Event Listeners

```js
// BAD: listener keeps a closure alive referencing large data, never removed
window.addEventListener("resize", handleResize);

// GOOD: remove when no longer needed
window.addEventListener("resize", handleResize);
// later...
window.removeEventListener("resize", handleResize);
```

```jsx
// React
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### d) Closures Holding Large Data Unintentionally

```js
// BAD: closure retains reference to `largeData` even though only `summary` is needed later
function processData(largeData) {
  const summary = summarize(largeData);
  return () => console.log(summary); // largeData is still reachable via closure scope
}

// GOOD: extract only what's needed before creating the closure
function processData(largeData) {
  const summary = summarize(largeData);
  largeData = null; // allow GC to reclaim it
  return () => console.log(summary);
}
```

### e) Global Variables / Growing Caches Without Limits

```js
// BAD: unbounded cache grows forever
const cache = {};
function memoize(key, value) {
  cache[key] = value; // never evicted
}

// GOOD: bounded cache with eviction (LRU)
const LRU = require("lru-cache");
const cache = new LRU({ max: 500 }); // evicts oldest when full
```

## 3. Detecting Memory Leaks

### Chrome DevTools — Memory Tab

```
1. Open DevTools -> Memory tab
2. Take a heap snapshot
3. Perform the suspected leaking action (e.g., open/close a modal repeatedly)
4. Take another snapshot
5. Compare snapshots -> look for objects that keep growing in count
```

### Node.js Heap Snapshot

```js
const v8 = require("v8");
const fs = require("fs");

function takeHeapSnapshot() {
  const snapshotStream = v8.getHeapSnapshot();
  const fileStream = fs.createWriteStream("heap.heapsnapshot");
  snapshotStream.pipe(fileStream);
}
```

```bash
node --inspect app.js
# then open chrome://inspect and use the Memory tab against the Node process
```

### Monitoring Memory Usage in Node.js

```js
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: (usage.rss / 1024 / 1024).toFixed(2) + " MB",
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
  });
}, 5000);
```

## 4. Reducing Memory Footprint

### Use Typed Arrays for Large Numeric Datasets

```js
// BAD: regular array of numbers - more overhead per element
const data = new Array(1000000).fill(0);

// GOOD: typed array - fixed-size, contiguous memory, much smaller footprint
const data = new Float64Array(1000000);
```

### Avoid Unnecessary Object/Array Copies

```js
// BAD: creates a full copy just to check something
const hasItem = [...largeArray].includes(x);

// GOOD: no copy needed
const hasItem = largeArray.includes(x);
```

### Use `WeakMap`/`WeakSet` for Metadata Tied to Object Lifetime

```js
// WeakMap allows keys (objects) to be garbage collected when no longer referenced elsewhere
const metadata = new WeakMap();

function attachMetadata(el, data) {
  metadata.set(el, data); // doesn't prevent el from being GC'd
}
```

### Release Large Objects Explicitly When Done

```js
let largeBuffer = await loadHugeFile();
processBuffer(largeBuffer);
largeBuffer = null; // hint that this can be collected
```

## 5. Backend / Node.js Specific Optimization

### Streaming Instead of Loading Entire Files Into Memory

```js
// BAD: loads entire file into memory
const fs = require("fs");
const data = fs.readFileSync("huge-file.csv");
processData(data);

// GOOD: stream in chunks
const stream = fs.createReadStream("huge-file.csv");
stream.on("data", (chunk) => processChunk(chunk));
stream.on("end", () => console.log("done"));
```

### Pagination/Batching for Large DB Result Sets

```js
// BAD: loads millions of rows into memory at once
const allUsers = await db.query("SELECT * FROM users");

// GOOD: process in batches/cursor
const batchSize = 1000;
let offset = 0;
while (true) {
  const batch = await db.query("SELECT * FROM users LIMIT ? OFFSET ?", [
    batchSize,
    offset,
  ]);
  if (batch.length === 0) break;
  await processBatch(batch);
  offset += batchSize;
}
```

### Limit Concurrent Operations (Backpressure)

```js
// BAD: spawns unlimited concurrent promises, can exhaust memory
await Promise.all(millionItems.map((item) => processItem(item)));

// GOOD: limit concurrency
const pLimit = require("p-limit");
const limit = pLimit(10); // max 10 concurrent
await Promise.all(millionItems.map((item) => limit(() => processItem(item))));
```

## 6. Frontend-Specific: Reducing Memory in Long-Running SPAs

### Clean Up Subscriptions in Frameworks

```jsx
// React - always clean up subscriptions (websockets, observables, etc.)
useEffect(() => {
  const subscription = observable.subscribe(handleData);
  return () => subscription.unsubscribe();
}, []);
```

### Virtualize Large Lists (Reduces DOM Node Memory, Not Just Rendering Cost)

```jsx
import { FixedSizeList } from "react-window";
// Only renders visible rows -> drastically fewer DOM nodes in memory
```

### Avoid Storing Large Data Structures in Component State Unnecessarily

```jsx
// BAD: entire large dataset kept in state even though only a slice is shown
const [allData, setAllData] = useState(hugeArray);

// GOOD: keep only what's displayed; fetch/paginate the rest on demand
const [visibleData, setVisibleData] = useState(hugeArray.slice(0, 50));
```

## 7. Garbage Collection Basics (V8 / Browser)

```
Generational GC:
  New objects -> Young Generation (Minor GC, frequent, fast)
  Objects surviving multiple GCs -> Old Generation (Major GC, less frequent, slower)

Long-lived objects that shouldn't be long-lived = leaks that force expensive Major GC cycles
```

Understanding this helps explain why leaked closures/listeners are so costly — they force objects into the old generation, making GC pauses longer and more frequent.

## 8. Best Practices

1. Always clean up timers, event listeners, and subscriptions (especially in SPA component lifecycles).
2. Use bounded/LRU caches instead of unbounded objects/maps for caching.
3. Stream large files/datasets instead of loading them fully into memory.
4. Use typed arrays for large numeric datasets.
5. Limit concurrency for bulk async operations to avoid memory spikes.
6. Use `WeakMap`/`WeakSet` when associating data with objects that should be independently garbage-collectable.
7. Virtualize long lists in the UI to reduce both DOM and memory footprint.
8. Profile regularly with heap snapshots — don't wait for production OOM crashes to start investigating.
