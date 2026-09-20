# Memoization

The **top-down** approach to dynamic programming: write the natural recursive solution, then cache results so overlapping subproblems are only computed once. Turns exponential-time recursion into polynomial time.

## Example — Fibonacci

Naive recursion recomputes the same values over and over (exponential O(2^n)):

```javascript
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2); // fib(3) gets computed many times over
}
```

With memoization, each subproblem is solved once:

```javascript
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);

  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

console.log(fibMemo(50)); // instant, vs. naive version which would take forever
```

## Example — Climbing Stairs (1 or 2 steps at a time)

```javascript
function climbStairs(n, memo = new Map()) {
  if (n <= 2) return n;
  if (memo.has(n)) return memo.get(n);

  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}

console.log(climbStairs(10)); // 89
```

## Example — Coin Change (fewest coins to make an amount)

```javascript
function coinChange(coins, amount, memo = new Map()) {
  if (amount === 0) return 0;
  if (amount < 0) return Infinity;
  if (memo.has(amount)) return memo.get(amount);

  let minCoins = Infinity;
  for (const coin of coins) {
    const result = coinChange(coins, amount - coin, memo);
    if (result !== Infinity) minCoins = Math.min(minCoins, result + 1);
  }

  memo.set(amount, minCoins);
  return minCoins;
}

console.log(coinChange([1, 2, 5], 11)); // 3 -> 5+5+1
```

## The general recipe

1. Write the brute-force recursive solution first (get correctness).
2. Identify the "state" — what changes between recursive calls? That's your cache key.
3. Before recursing, check the cache. After computing, store the result.

## Complexity

Turns exponential-time naive recursion into O(number of unique subproblems) time, at the cost of O(number of unique subproblems) space for the cache.

## Recognize this pattern when...

A recursive solution exists naturally, but has overlapping subproblems (the same inputs get recomputed) — the recursion tree has repeated branches.
