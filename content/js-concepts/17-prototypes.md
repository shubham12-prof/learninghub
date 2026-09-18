# Prototypes

## Explanation
JavaScript objects can inherit properties and methods from other objects via a hidden link called the **prototype**. This is how JS does inheritance — it's called **prototypal inheritance**, different from classical class-based inheritance in languages like Java.

- Every object has an internal link (`[[Prototype]]`, accessible via `__proto__` or `Object.getPrototypeOf()`) to another object.
- When you access a property, JS first checks the object itself — if not found, it walks up the **prototype chain** until it finds it (or reaches `null`).
- `class` syntax in modern JS is mostly "syntax sugar" over this same prototype system.

## Examples
```js
const animal = {
  eat() { console.log(`${this.name} is eating`); }
};

const dog = Object.create(animal); // dog's prototype is animal
dog.name = "Rex";
dog.eat(); // "Rex is eating" — found on animal's prototype

console.log(dog.hasOwnProperty("eat")); // false — it's inherited, not own
```

### With classes (same thing, nicer syntax)
```js
class Animal {
  constructor(name) { this.name = name; }
  eat() { console.log(`${this.name} is eating`); }
}

class Dog extends Animal {
  bark() { console.log(`${this.name} says Woof!`); }
}

const rex = new Dog("Rex");
rex.eat();  // inherited from Animal
rex.bark(); // defined on Dog
```

Under the hood, `Dog.prototype`'s prototype is `Animal.prototype` — that's the chain.

## Why it matters
Understanding prototypes explains *why* methods you never explicitly defined (like `.map()`, `.toString()`) work on arrays and objects — they live on `Array.prototype` and `Object.prototype`. It also demystifies what `class`/`extends` are really doing behind the scenes.

## Questions
1. What is the prototype chain, and what happens when a property isn't found on an object directly?
2. How does `class`/`extends` relate to prototypes under the hood?
3. What's the difference between `dog.hasOwnProperty("eat")` being false vs. `"eat" in dog` being true in the example above?
4. Where do array methods like `.map()` and `.filter()` actually "live"?
5. Predict: if you add a new method to `Animal.prototype` *after* creating `rex`, will `rex` be able to use it? Why or why not?
