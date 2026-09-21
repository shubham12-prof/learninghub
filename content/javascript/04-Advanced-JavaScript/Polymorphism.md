# Polymorphism

Different classes providing their own implementation of the same method name.

```js
class Shape {
  area() {
    return 0;
  }
}
class Circle extends Shape {
  constructor(r) {
    super();
    this.r = r;
  }
  area() {
    return Math.PI * this.r ** 2;
  }
}
class Square extends Shape {
  constructor(s) {
    super();
    this.s = s;
  }
  area() {
    return this.s ** 2;
  }
}
[new Circle(2), new Square(3)].forEach((shape) => console.log(shape.area()));
// Each calls its OWN area() — same method name, different behavior
```
