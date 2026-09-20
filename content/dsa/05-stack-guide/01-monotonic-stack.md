# Monotonic Stack

A stack that maintains its elements in strictly increasing or strictly decreasing order. Whenever a new element would break that order, you pop elements off until it's restored — each pop usually represents "resolving" a comparison for the popped element.

## Example — Daily Temperatures

For each day, find how many days you'd have to wait for a warmer temperature.

```javascript
function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = []; // stores indices, temps at those indices are decreasing

  for (let i = 0; i < temps.length; i++) {
    // current temp is warmer than the temp at the top of the stack
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      result[prevIndex] = i - prevIndex; // days waited
    }
    stack.push(i);
  }

  return result;
}

console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));
// [1, 1, 4, 2, 1, 1, 0, 0]
```

## Example — Largest Rectangle in Histogram (harder, common follow-up)

Uses a monotonic increasing stack of bar indices; when a shorter bar appears, pop and calculate area using the popped bar's height.

```javascript
function largestRectangleArea(heights) {
  const stack = []; // increasing heights
  let maxArea = 0;

  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];

    while (stack.length > 0 && heights[stack[stack.length - 1]] > h) {
      const height = heights[stack.pop()];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, height * width);
    }

    stack.push(i);
  }

  return maxArea;
}
```

## Complexity

O(n) time — each element is pushed and popped at most once, even though there's a nested loop.
O(n) space for the stack.

## Recognize this pattern when...

The problem asks "for each element, find the next/previous greater/smaller element" or involves comparing elements against a running boundary (histograms, stock spans, temperatures).
