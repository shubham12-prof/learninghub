/*
  Top 30 - #21: Promise.all (polyfill)

  PROBLEM: implement your own Promise.all() - resolves with an array
  of all results (SAME ORDER as input) once EVERY promise resolves;
  rejects immediately if ANY promise rejects.
*/

function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let completedCount = 0;

    if (promises.length === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((value) => {
          results[index] = value; // preserve ORIGINAL order, not completion order
          completedCount++;
          if (completedCount === promises.length) {
            resolve(results);
          }
        })
        .catch(reject); // any single failure rejects the whole thing
    });
  });
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const p1 = new Promise((res) => setTimeout(() => res(1), 300));
const p2 = new Promise((res) => setTimeout(() => res(2), 100));

myPromiseAll([p1, p2]).then((results) => console.log(results));
// [1, 2] - original order preserved, even though p2 finishes first

/*
  TIME COMPLEXITY: O(n) - one .then/.catch attached per promise.
*/
