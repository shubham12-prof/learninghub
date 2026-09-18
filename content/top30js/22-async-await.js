/*
  Top 30 - #22: Async/Await (output prediction practice)

  MENTAL MODEL: an async function runs SYNCHRONOUSLY until its first
  "await". At await, it pauses and hands control back to the caller.
  Code AFTER await runs later, as a microtask.
*/

async function foo() {
  console.log("foo start");
  await null;
  console.log("foo end");
}

console.log("script start");
foo();
console.log("script end");

/*
  EXPECTED OUTPUT:
    script start
    foo start
    script end
    foo end
  WHY: foo() runs sync until "await" ("foo start" logs). At await, it
  pauses, giving control back - "script end" runs next. "foo end" only
  runs after all sync code finishes, as a microtask.
*/


// -----------------------------------------------------------------
// try/catch with await - catches promise REJECTIONS too
// -----------------------------------------------------------------
async function mayFail() {
  try {
    await Promise.reject(new Error("Failed!"));
  } catch (err) {
    console.log("Caught:", err.message); // Caught: Failed!
  }
}
mayFail();


// -----------------------------------------------------------------
// async functions ALWAYS return a Promise, even for plain values
// -----------------------------------------------------------------
async function getNumber() {
  return 42;
}
console.log(getNumber()); // Promise { 42 } - NOT just 42
getNumber().then((val) => console.log(val)); // 42
