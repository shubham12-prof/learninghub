/*
  Top 30 - #25: "this" Keyword Output (predict-the-output practice)

  RULE: "this" is determined by HOW a function is CALLED, not where
  it's written - EXCEPT for arrow functions, which use "this" from
  their surrounding (enclosing) scope instead.
*/

const person = {
  name: "Riya",
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  },
  greetArrow: () => {
    // Arrow function - "this" comes from OUTSIDE the object, NOT person.
    console.log(`Hi, I'm ${this.name}`);
  },
};

person.greet();      // "Hi, I'm Riya" - called AS a method, this=person
person.greetArrow();  // "Hi, I'm undefined" - arrow function, this is
                       // NOT person (it uses the outer/module scope)

const detachedGreet = person.greet;
// detachedGreet(); // "Hi, I'm undefined" - called standalone, this is
                     // no longer person


// -----------------------------------------------------------------
// Classic setTimeout callback trap
// -----------------------------------------------------------------
const timer = {
  seconds: 0,
  startRegular() {
    setTimeout(function () {
      // Regular function - "this" is NOT timer here.
      console.log("regular:", this.seconds); // undefined -> NaN
    }, 0);
  },
  startArrow() {
    setTimeout(() => {
      // Arrow function - "this" is inherited from startArrow's scope,
      // where "this" correctly refers to "timer".
      console.log("arrow:", this.seconds); // 0
    }, 0);
  },
};

timer.startRegular();
timer.startArrow();
