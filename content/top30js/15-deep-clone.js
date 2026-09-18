/*
  Top 30 - #15: Deep Clone

  PROBLEM: create a true copy of an object/array, including all nested
  levels, so changing the copy never affects the original.
*/

function deepClone(value) {
  // BASE CASE: primitives are already safe to copy directly.
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }

  const clonedObj = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clonedObj[key] = deepClone(value[key]);
    }
  }
  return clonedObj;
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const original = { name: "Neha", address: { city: "Delhi" }, tags: ["a", "b"] };
const cloned = deepClone(original);

cloned.address.city = "Mumbai";
cloned.tags.push("c");

console.log(original.address.city); // "Delhi" - original unaffected
console.log(original.tags);         // ["a", "b"] - original unaffected
console.log(cloned.address.city);   // "Mumbai"

/*
  WHY {...obj} ISN'T ENOUGH: spread only copies the TOP level - nested
  objects/arrays would still be SHARED between original and copy.

  BONUS: structuredClone(obj) is a native alternative built into
  modern browsers/Node, but it doesn't work for functions or a few
  special object types.

  TIME COMPLEXITY: O(n) - n = total number of values across all
  nesting levels.
*/
