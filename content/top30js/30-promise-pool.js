/*
  Top 30 - #30: Promise Pool (concurrency limit)

  PROBLEM: run a list of tasks (functions returning Promises)
  CONCURRENTLY, but only allow a LIMITED number to run at the same
  time (e.g. max 2), instead of firing everything at once.
*/

async function promisePool(tasks, limit) {
  const results = [];
  let currentIndex = 0;

  // Each "worker" keeps pulling the next available task until none remain.
  async function worker() {
    while (currentIndex < tasks.length) {
      const taskIndex = currentIndex;
      currentIndex++; // claim this task BEFORE awaiting, avoids race conditions

      try {
        results[taskIndex] = await tasks[taskIndex]();
      } catch (error) {
        results[taskIndex] = { error };
      }
    }
  }

  // Start "limit" workers running concurrently.
  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);

  return results;
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
function makeTask(id, delay) {
  return () =>
    new Promise((resolve) => {
      console.log(`Task ${id} started`);
      setTimeout(() => {
        console.log(`Task ${id} finished`);
        resolve(`Result ${id}`);
      }, delay);
    });
}

const tasks = [makeTask(1, 1000), makeTask(2, 500), makeTask(3, 800), makeTask(4, 300)];

promisePool(tasks, 2).then((results) => console.log("All results:", results));
// With limit=2, only 2 tasks run at a time - task 3 doesn't start
// until either task 1 or task 2 finishes.

/*
  WHY THIS MATTERS: firing hundreds of requests at once with
  Promise.all() could overwhelm a server or hit rate limits. A promise
  pool caps concurrency, much friendlier for real APIs.
*/
