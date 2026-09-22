// ======================================================
// THE PROBLEM
// ======================================================
// JavaScript compares arrays by REFERENCE, not by CONTENT.
//
//   console.log([1, 2] === [1, 2]); // false!
//
// Even though these two arrays LOOK the same, JavaScript sees
// them as two different objects in memory. So a trick like
// [...new Set(arr)] does NOT remove duplicate arrays — Set
// also compares by reference, not value.
//
// To actually remove duplicate arrays, we need to compare
// their CONTENTS instead of their identity.


// ======================================================
// THE IDEA
// ======================================================
// 1. Go through each array in the list one by one.
// 2. Turn the current array into a STRING (using JSON.stringify),
//    so it becomes easy to compare.
// 3. Check if that same string already exists in our "results so far."
// 4. If it doesn't exist yet, keep the array. If it does, skip it
//    (it's a duplicate).
//
// Converting [1, 2] with JSON.stringify([1, 2]) gives "[1,2]" —
// a plain string. Two strings CAN be compared directly with ===,
// unlike two arrays.


// ======================================================
// VERSION 1: Nested loop (easier to understand)
// ======================================================
function removeDuplicateArrays(arr) {
    // This will hold the unique arrays we find.
    const result = [];

    // Loop through every array in the input list.
    for (let i = 0; i < arr.length; i++) {

        // Convert the current array to a string, e.g. [1,2] -> "[1,2]"
        const current = JSON.stringify(arr[i]);

        // Flag to track whether we've already stored this array.
        let alreadyExists = false;

        // Check everything we've already saved in `result` so far,
        // converting each one to a string too, and comparing it
        // to `current`.
        for (let j = 0; j < result.length; j++) {
            if (JSON.stringify(result[j]) === current) {
                alreadyExists = true; // found a match
                break;                // no need to keep checking
            }
        }

        // Only add the array if we didn't already have a copy of it.
        if (!alreadyExists) {
            result.push(arr[i]);
        }
    }

    return result;
}


// ======================================================
// VERSION 2: Using a Set (faster for large arrays)
// ======================================================
// The nested-loop version works, but checking `result` with
// an inner loop every time can get slow for big lists.
// A Set lets us check "have I seen this before?" almost instantly.
function removeDuplicateArraysFast(arr) {
    const seen = new Set();   // keeps track of strings we've already seen
    const result = [];        // keeps the actual unique arrays

    for (const item of arr) {
        const key = JSON.stringify(item); // e.g. [3,4] -> "[3,4]"

        if (!seen.has(key)) {
            seen.add(key);     // remember this array's "signature"
            result.push(item); // keep the original array
        }
    }

    return result;
}


// ======================================================
// EXAMPLE / TRACE
// ======================================================
// Input:
//   [[1, 2], [3, 4], [1, 2], [5, 6], [3, 4]]
//
// Step-by-step (Version 1):
//   i=0  [1,2] -> "[1,2]" -> not in result -> add it
//   i=1  [3,4] -> "[3,4]" -> not in result -> add it
//   i=2  [1,2] -> "[1,2]" -> already in result -> skip (duplicate)
//   i=3  [5,6] -> "[5,6]" -> not in result -> add it
//   i=4  [3,4] -> "[3,4]" -> already in result -> skip (duplicate)
//
// Final result: [[1,2], [3,4], [5,6]]

const input = [
    [1, 2],
    [3, 4],
    [1, 2],
    [5, 6],
    [3, 4]
];

console.log("Version 1 (nested loop):", removeDuplicateArrays(input));
console.log("Version 2 (Set-based):  ", removeDuplicateArraysFast(input));


// ======================================================
// KEY TAKEAWAY
// ======================================================
// To compare arrays (or objects) by content instead of reference,
// convert them to strings with JSON.stringify — then you can
// compare them like normal text with ===.