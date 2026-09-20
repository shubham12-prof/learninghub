# 07. Virtualization

## What is Virtualization (Windowing)?

Virtualization (also called "windowing") renders only the DOM elements currently visible within a scrollable viewport, rather than rendering every single item in a large list/grid/table all at once — dramatically reducing the number of actual DOM nodes at any given time, regardless of how large the underlying dataset is.

```
Without virtualization:  a list of 10,000 items -> 10,000 DOM nodes created,
                          even though only ~10-20 are actually visible on screen at once

With virtualization:       a list of 10,000 items -> only ~10-20 DOM nodes exist at any time,
                            representing whichever items are CURRENTLY scrolled into view
```

## Why Large Unvirtualized Lists Are Slow

Every DOM node has real memory and rendering cost — style calculation, layout, paint. Rendering thousands of DOM nodes (even if most are off-screen and invisible) means:

```
- Massive initial render time (creating/mounting thousands of nodes)
- High memory usage (each node + its associated React fiber/component instance, if applicable)
- Slow scroll performance (the browser must still account for all those nodes during layout/paint,
  even ones not visible)
- Slow updates (re-rendering/reconciling thousands of nodes for even a small data change)
```

Virtualization sidesteps all of this by keeping the actual DOM node count roughly constant (proportional to viewport size, not dataset size) regardless of whether the underlying list has 100 or 100,000 items.

## How Virtualization Works — The Core Mechanism

```
1. Calculate the total "virtual" height of the full list (item count × average/known item height)
2. Based on current scroll position, determine WHICH items are currently within (or near) the viewport
3. Render ONLY those items' actual DOM nodes
4. Position them absolutely (or via transforms) at their correct location within the full virtual height
5. As the user scrolls, continuously recalculate which items should be rendered,
   mounting newly-visible items and unmounting no-longer-visible ones
```

```
Full list "virtual" height: 10,000 items × 50px each = 500,000px total scrollable height
Actual rendered DOM:          only the ~15 items currently within the visible viewport window,
                               absolutely positioned at their correct offset within that 500,000px space
```

The scrollbar and scroll behavior feel completely normal to the user — the illusion of a fully-rendered 10,000-item list is maintained, while the actual DOM footprint stays tiny.

## Implementing Virtualization with `react-window`

```bash
npm install react-window
```

```jsx
import { FixedSizeList } from "react-window";

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={600} // the VISIBLE viewport height
      itemCount={items.length}
      itemSize={50} // fixed height per row, in pixels
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

`react-window` is a lightweight, widely-used library implementing exactly this windowing pattern — handling the scroll position tracking, visible-range calculation, and absolute positioning automatically.

## Variable-Size Items

```jsx
import { VariableSizeList } from "react-window";

function VariableVirtualizedList({ items }) {
  const getItemSize = (index) => items[index].height; // different height per item

  const Row = ({ index, style }) => (
    <div style={style}>{items[index].content}</div>
  );

  return (
    <VariableSizeList
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

Variable-size virtualization is meaningfully more complex than fixed-size (since the library must track/cache each item's actual measured or declared height to calculate correct positioning), but necessary for content like chat messages or comments where item heights genuinely vary.

## Virtualized Grids (2D Virtualization)

```jsx
import { FixedSizeGrid } from "react-window";

function VirtualizedGrid({ data, columnCount, rowCount }) {
  const Cell = ({ columnIndex, rowIndex, style }) => (
    <div style={style}>{data[rowIndex * columnCount + columnIndex]}</div>
  );

  return (
    <FixedSizeGrid
      columnCount={columnCount}
      columnWidth={150}
      rowCount={rowCount}
      rowHeight={150}
      height={600}
      width={800}
    >
      {Cell}
    </FixedSizeGrid>
  );
}
```

Extends the same windowing concept to two dimensions — useful for large image galleries, spreadsheets, or grid-based product catalogs.

## TanStack Virtual — A Modern, Framework-Agnostic Alternative

```bash
npm install @tanstack/react-virtual
```

```jsx
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              height: virtualRow.size,
              width: "100%",
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

TanStack Virtual is framework-agnostic (React, Vue, Svelte, Solid adapters all available) and provides a more headless, flexible primitive compared to `react-window`'s more opinionated, ready-made components.

## Windowed Rendering + Infinite Scroll — A Common Combined Pattern

As noted in the Lazy Loading notes, infinite scroll (lazily fetching more data as the user scrolls) should typically be combined with virtualization for very large lists — lazy loading solves the network/data-fetching cost, while virtualization solves the DOM-node-count cost; using only one without the other leaves the other problem unsolved.

```jsx
function InfiniteVirtualList() {
  const [items, setItems] = useState(initialItems);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1);
      if (lastItem && lastItem.index >= items.length - 5) {
        loadMoreItems().then((newItems) =>
          setItems((prev) => [...prev, ...newItems]),
        );
      }
    },
  });

  // ... render as before
}
```

## When Virtualization Is (and Isn't) Worth the Complexity

```
Worth it:      lists/tables/grids with hundreds or thousands+ of items — chat histories, data tables,
                 large product catalogs, activity feeds, spreadsheet-like interfaces

NOT worth it:    short lists (a few dozen items or fewer) — the added complexity/dependency
                  isn't justified when the unvirtualized DOM cost is already negligible
```

Virtualization adds genuine implementation complexity (measuring/tracking item sizes, handling dynamic content, accessibility considerations around off-screen content not being in the DOM) — it should be reached for when actually needed based on real list sizes, not applied reflexively to every list regardless of size.

## Accessibility Considerations with Virtualization

Since off-screen items genuinely don't exist in the DOM, certain accessibility patterns need extra care — screen readers navigating via "find on page" (Ctrl+F) won't find content that isn't currently rendered, and ARIA live regions/announcements may need adjustment. Libraries like `react-window` and TanStack Virtual provide some built-in ARIA support, but virtualized lists generally require more deliberate accessibility testing than simple, fully-rendered lists.

## Common Interview-Style Questions

- **What problem does virtualization (windowing) solve?**
  Rendering every item in a very large list/grid creates a huge number of DOM nodes, most of which are off-screen and invisible at any given time — causing slow initial render, high memory usage, and poor scroll/update performance; virtualization renders only the currently-visible items' DOM nodes, keeping the actual DOM footprint roughly constant regardless of the underlying dataset's total size.

- **How does virtualization maintain the illusion of a fully-rendered list while only rendering a small subset of items?**
  It calculates the full list's total "virtual" scrollable height based on item count and size, then absolutely positions only the currently-visible items' actual DOM nodes at their correct offset within that virtual space — as the user scrolls, it continuously recalculates the visible range, mounting newly-visible items and unmounting ones no longer in view.

- **Why is variable-size item virtualization more complex than fixed-size virtualization?**
  The library must track or measure each individual item's actual height to correctly calculate every item's position within the virtual list, rather than being able to simply multiply a single known item height by an index — this requires additional bookkeeping/caching that fixed-size virtualization doesn't need.

- **Why should infinite scroll for very large lists typically be combined with virtualization rather than used alone?**
  Infinite scroll (lazily fetching more data) solves the network/data-fetching cost of a large dataset, but without virtualization, the number of actual DOM nodes rendered keeps growing unboundedly as more pages of data load — virtualization separately addresses the DOM-node-count problem, and both together are needed for genuinely large, smoothly-performing lists.

- **When would you decide NOT to use virtualization for a list, despite its performance benefits?**
  For short lists (a few dozen items or fewer), where the unvirtualized DOM cost is already negligible — virtualization adds genuine implementation complexity (size measurement/tracking, accessibility considerations) that isn't justified unless the list is actually large enough (hundreds to thousands of items) for the DOM-node-count problem to be real in the first place.
