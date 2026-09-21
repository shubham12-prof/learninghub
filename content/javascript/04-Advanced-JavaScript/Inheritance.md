# Inheritance

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  speak() {
    return `${super.speak()}, specifically a bark`; // call parent method
  }
}
new Dog("Rex").speak(); // "Rex makes a sound, specifically a bark"
```
