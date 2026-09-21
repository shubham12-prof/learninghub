# Classes

Syntactic sugar over prototype-based inheritance.

```js
class Person {
  #ssn; // private field (true encapsulation)

  constructor(name, age, ssn) {
    this.name = name;
    this.age = age;
    this.#ssn = ssn;
  }
  greet() {
    return `Hi, I'm ${this.name}`;
  }
  static create(name) {
    // static method — called on the class, not instance
    return new Person(name, 0, null);
  }
  get info() {
    return `${this.name}, ${this.age}`;
  } // getter
  set info(val) {
    [this.name, this.age] = val.split(",");
  } // setter
}
```
