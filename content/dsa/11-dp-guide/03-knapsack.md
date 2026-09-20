# Knapsack

Given items with weights and values, and a knapsack with a weight capacity, choose items to maximize total value without exceeding capacity. The classic DP problem that teaches how to build a 2D (or optimized 1D) table over "items considered so far" x "remaining capacity."

## 0/1 Knapsack — each item can be used at most once

### Tabulation (2D table)

```javascript
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  // dp[i][w] = max value using first i items with capacity w
  const dp = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      // option 1: don't take item i-1
      dp[i][w] = dp[i - 1][w];

      // option 2: take item i-1, if it fits
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1],
        );
      }
    }
  }

  return dp[n][capacity];
}

const weights = [1, 3, 4, 5];
const values = [1, 4, 5, 7];
console.log(knapsack01(weights, values, 7)); // 9 -> items with weight 3+4
```

### Space-optimized (1D array, iterate weight backwards)

```javascript
function knapsack01Optimized(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < weights.length; i++) {
    // iterate backwards so each item is only used once per row
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}
```

## Unbounded Knapsack — items can be reused unlimited times

```javascript
function unboundedKnapsack(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);

  for (let w = 1; w <= capacity; w++) {
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] <= w) {
        dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
      }
    }
  }

  return dp[capacity];
}
```

## Key difference between 0/1 and Unbounded

0/1: iterate weight **backwards** (or use a 2D table) so each item is considered only once.
Unbounded: iterate weight **forwards**, since reusing `dp[w - weight[i]]` (already updated in this same pass) allows the same item to be picked again.

## Complexity

O(n × capacity) time, O(capacity) space (optimized) or O(n × capacity) space (2D table).

## Where it shows up

Subset Sum, Partition Equal Subset Sum, Coin Change (unbounded variant), budget allocation problems.
