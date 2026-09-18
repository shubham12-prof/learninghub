/*
  Top 30 - #7: Best Time to Buy and Sell Stock

  PROBLEM: given an array of daily stock prices, find the MAXIMUM
  profit you could make from ONE buy and ONE sell (buy must happen
  BEFORE sell). If no profit is possible, return 0.
  Example: [7,1,5,3,6,4] -> 5   (buy at 1, sell at 6 -> profit 5)

  WHY THIS IS A "ONE PASS" PROBLEM: as we scan through prices, we just
  track the LOWEST price seen SO FAR, and at each day, check "if I
  sold today, having bought at the lowest price so far, what would my
  profit be?" - keeping the best one found.
*/

function maxProfit(prices) {
  let minPriceSoFar = Infinity;
  let maxProfitSoFar = 0;

  for (const price of prices) {
    if (price < minPriceSoFar) {
      // Found a new lowest buying price.
      minPriceSoFar = price;
    } else {
      // Check if selling TODAY (at "price") after buying at the
      // lowest price so far would beat our best profit yet.
      const profitIfSoldToday = price - minPriceSoFar;
      maxProfitSoFar = Math.max(maxProfitSoFar, profitIfSoldToday);
    }
  }

  return maxProfitSoFar;
}

console.log(maxProfit([7, 1, 5, 3, 6, 4])); // 5  (buy at 1, sell at 6)
console.log(maxProfit([7, 6, 4, 3, 1]));    // 0  (prices only drop, no profit possible)

/*
  WALKTHROUGH for [7,1,5,3,6,4]:
  price=7: 7 < Infinity -> minPrice=7.
  price=1: 1 < 7 -> minPrice=1.
  price=5: 5 not < 1 -> profit if sold today = 5-1=4. maxProfit=4.
  price=3: 3 not < 1 -> profit = 3-1=2. maxProfit stays 4.
  price=6: 6 not < 1 -> profit = 6-1=5. maxProfit=5.
  price=4: 4 not < 1 -> profit = 4-1=3. maxProfit stays 5.
  Final answer: 5

  TIME COMPLEXITY: O(n) - single pass through the prices.
  SPACE COMPLEXITY: O(1) - just two tracking variables.
*/
