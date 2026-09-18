/*
  Top 30 - #26: Retry API

  PROBLEM: given a function returning a Promise (e.g. an API call
  that might fail), automatically retry it a number of times before
  finally giving up.
*/

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryAPI(apiCallFn, retries = 3, delayMs = 1000) {
  try {
    return await apiCallFn();
  } catch (error) {
    if (retries <= 0) {
      throw error; // no attempts left, give up
    }
    console.log(`Failed. Retrying... (${retries} left)`);
    await sleep(delayMs);
    return retryAPI(apiCallFn, retries - 1, delayMs); // try again
  }
}

// -----------------------------------------------------------------
// Example usage - simulating a flaky API that fails twice, then works
// -----------------------------------------------------------------
let attempts = 0;
function flakyCall() {
  attempts++;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      attempts < 3 ? reject(new Error(`Attempt ${attempts} failed`)) : resolve("Success!");
    }, 200);
  });
}

retryAPI(flakyCall, 3, 500)
  .then((result) => console.log(result))          // "Success!"
  .catch((err) => console.log("All retries used:", err.message));

/*
  TIME COMPLEXITY: at most (retries + 1) attempts total.
*/
