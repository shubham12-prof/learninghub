/*
  Top 30 - #29: Infinite Currying

  PROBLEM: implement add() so it can be chained indefinitely:
  add(1)(2)(3)(4)... and so on, eventually giving the total sum.
*/

function add(firstNum) {
  let sum = firstNum; // remembered across calls via closure

  function innerAdd(nextNum) {
    sum += nextNum;
    return innerAdd; // return itself, so chaining can continue
  }

  // Lets JS automatically read "sum" when this is used as a number
  // (e.g. console.log(add(1)(2)(3) + 0), or console.log's default
  // coercion in some environments).
  innerAdd.valueOf = () => sum;

  return innerAdd;
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
console.log(add(1)(2)(3).valueOf());    // 6
console.log(add(1)(2)(3)(4).valueOf()); // 10
console.log(add(1)(2)(3) + 0);          // 6 (valueOf triggered automatically)

/*
  WHY IT WORKS: each call to innerAdd updates "sum" (shared via
  closure) and returns ITSELF, so another () call can chain on
  indefinitely. valueOf() is the escape hatch to read the final number.
*/
