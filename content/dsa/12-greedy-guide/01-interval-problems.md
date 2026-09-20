# Interval Problems

A family of greedy problems involving ranges `[start, end]` — merging overlaps, inserting new intervals, or finding minimum removals. The common first step is almost always: **sort by start (or end) time**.

## Merge Intervals

```javascript
function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];

  intervals.sort((a, b) => a[0] - b[0]); // sort by start time
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const current = intervals[i];

    if (current[0] <= last[1]) {
      // overlapping -> merge by extending the end
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }

  return result;
}

console.log(
  mergeIntervals([
    [1, 3],
    [2, 6],
    [8, 10],
    [15, 18],
  ]),
);
// [[1, 6], [8, 10], [15, 18]]
```

## Insert Interval (into an already-sorted, non-overlapping list)

```javascript
function insertInterval(intervals, newInterval) {
  const result = [];
  let i = 0;
  const n = intervals.length;

  // add all intervals ending before newInterval starts
  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i]);
    i++;
  }

  // merge all overlapping intervals into newInterval
  while (i < n && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);

  // add the rest
  while (i < n) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}
```

## Non-overlapping Intervals — minimum removals to eliminate all overlaps

```javascript
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[1] - b[1]); // sort by END time — key greedy insight
  let count = 0;
  let lastEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < lastEnd) {
      count++; // this interval overlaps -> remove it (greedily keep the one ending earlier)
    } else {
      lastEnd = intervals[i][1];
    }
  }

  return count;
}

console.log(
  eraseOverlapIntervals([
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 3],
  ]),
); // 1
```

## Complexity

O(n log n) time (dominated by sorting), O(n) or O(1) extra space depending on the variant.

## Why sort by end time (not start) for the removal problem?

Keeping the interval that ends earliest leaves the most room for future intervals to fit without overlapping — a classic greedy exchange argument.
