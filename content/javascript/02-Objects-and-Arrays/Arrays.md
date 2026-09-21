# Arrays

Ordered, index-based collections. In JS, arrays are actually objects with numeric keys and a `length` property.

```js
const fruits = ["apple", "banana", "mango"];
fruits[0]; // "apple"
fruits.length; // 3

fruits.push("kiwi"); // add to end
fruits.pop(); // remove from end
fruits.unshift("grape"); // add to start
fruits.shift(); // remove from start
fruits.splice(1, 1, "pear"); // remove/insert at index
fruits.slice(0, 2); // shallow copy of a range (non-mutating)

Array.isArray(fruits); // true
```
