# Objects

Collections of key-value pairs.

```js
const person = {
  name: "Alice",
  age: 25,
  greet() {
    return `Hi, I'm ${this.name}`;
  },
};

person.name; // dot notation
person["age"]; // bracket notation (needed for dynamic keys)

const key = "age";
person[key]; // 25

// Adding/removing
person.city = "Delhi";
delete person.city;

// Checking existence
"name" in person; // true
person.hasOwnProperty("name"); // true
```
