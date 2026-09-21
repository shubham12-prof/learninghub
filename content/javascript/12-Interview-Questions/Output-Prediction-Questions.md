# Output-Prediction Questions

**Q1.**

```js
console.log(1 + "1");
console.log(1 - "1");
console.log("5" + 3 + 2);
console.log(5 + 3 + "2");
```

<details><summary>Answer</summary>

`"11"`, `0`, `"532"`, `"82"` — `+` with a string triggers string concatenation left-to-right; `-` always coerces to numbers.

</details>

**Q2.**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

<details><summary>Answer</summary>

`3 3 3` — `var` is function-scoped, so all three callbacks close over the SAME `i`, which is 3 by the time they run. Using `let` instead would print `0 1 2`.

</details>

**Q3.**

```js
console.log(typeof typeof 1);
```

<details><summary>Answer</summary>

`"string"` — `typeof 1` is `"number"` (a string), and `typeof "number"` is `"string"`.

</details>

**Q4.**

```js
const obj = { a: 1 };
const clone = obj;
clone.a = 2;
console.log(obj.a);
```

<details><summary>Answer</summary>

`2` — objects are assigned by reference, so `clone` and `obj` point to the same object.

</details>

**Q5.**

```js
console.log([1, 2, 3] + [4, 5, 6]);
```

<details><summary>Answer</summary>

`"1,2,34,5,6"` — arrays are converted to strings (joined by commas) then concatenated.

</details>
