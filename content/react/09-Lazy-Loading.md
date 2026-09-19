# Lazy Loading

The general practice of deferring the loading of a resource (a component, an image, a library) until it's actually needed — code splitting (previous file) is React's specific application of lazy loading to JS bundles.

```jsx
// Component lazy loading
const HeavyChart = React.lazy(() => import("./HeavyChart"));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<p>Loading chart...</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

```jsx
// Lazy loading images (native browser support, no library needed)
<img src="photo.jpg" loading="lazy" alt="Description" />;

// Lazy loading a non-component library only when a feature is used
async function exportToPdf() {
  const { jsPDF } = await import("jspdf"); // only downloaded when this function runs
  const doc = new jsPDF();
  // ...
}
```

**Why it matters:** users often only interact with a fraction of an app's total features in a given session — shipping every feature's code upfront wastes bandwidth and slows the initial render (Time to Interactive).

**Interview note:** lazy loading a component that's _always_ visible above the fold (like a header) provides no benefit and adds a loading flicker — reserve it for below-the-fold content, rarely-used features (admin panels, modals), and heavy third-party libraries.
