/*
  Top 30 - #17: Flatten Object

  PROBLEM: flatten a deeply nested object into a single-level object,
  joining nested keys with ".".
  Example: { a: 1, b: { c: 2, d: { e: 3 } } } -> { a: 1, "b.c": 2, "b.d.e": 3 }
*/

function flattenObject(obj, parentKey = "", result = {}) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = parentKey ? `${parentKey}.${key}` : key;
    const value = obj[key];

    const isNestedObject =
      typeof value === "object" && value !== null && !Array.isArray(value);

    if (isNestedObject) {
      flattenObject(value, newKey, result); // recurse, building up the path
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

console.log(flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } }));
// { a: 1, 'b.c': 2, 'b.d.e': 3 }

/*
  TIME COMPLEXITY: O(n) - n = total number of keys across all nesting levels.
*/
