# Tabulation

The **bottom-up** approach to dynamic programming: build a table iteratively, starting from the smallest subproblems and working up to the final answer. Avoids recursion entirely — no call stack, no risk of stack overflow on large inputs.

## Example — Fibonacci

```javascript
function fibTab(n) {
  if (n <= 1) return n;

  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

console.log(fibTab(10)); // 55
```

### Space-optimized version (only need the last two values)

```javascript
function fibTabOptimized(n) {
  if (n <= 1) return n;

  let prev2 = 0,
    prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

## Example — Climbing Stairs

```javascript
function climbStairs(n) {
  if (n <= 2) return n;

  const dp = new Array(n + 1);
  dp[1] = 1;
  dp[2] = 2;

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}
```

## Example — Coin Change (bottom-up)

```javascript
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // 0 coins needed to make amount 0

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] !== Infinity) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log(coinChange([1, 2, 5], 11)); // 3
```

## Memoization vs Tabulation

|                           | Memoization (top-down)                               | Tabulation (bottom-up)            |
| ------------------------- | ---------------------------------------------------- | --------------------------------- |
| Direction                 | Starts from the big problem, recurses down           | Starts from base cases, builds up |
| Implementation            | Recursive + cache                                    | Iterative + table                 |
| Stack usage               | Uses call stack (risk of overflow on deep recursion) | No recursion, no stack risk       |
| Solves only what's needed | Yes — only computes subproblems actually reached     | No — often fills the entire table |

## Complexity

Same time complexity as the memoized version: O(number of subproblems). Space can often be optimized further by only keeping the last few table entries instead of the whole array.

## Recognize this pattern when...

You already have a working memoized solution and want to avoid recursion overhead, or the problem has a clear "build up from smaller cases" structure (grid paths, edit distance, knapsack).
