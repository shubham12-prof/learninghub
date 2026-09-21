# DOM (Document Object Model)

A tree-like representation of the HTML page that JS can read and manipulate.

```js
// Selecting elements
document.getElementById("title");
document.querySelector(".card"); // first match
document.querySelectorAll(".card"); // all matches (NodeList)

// Modifying
const el = document.querySelector("#title");
el.textContent = "New Title";
el.innerHTML = "<span>Bold</span>";
el.style.color = "red";
el.classList.add("active");
el.classList.toggle("hidden");
el.setAttribute("data-id", "42");

// Creating & inserting
const li = document.createElement("li");
li.textContent = "New item";
document.querySelector("ul").appendChild(li);

// Removing
el.remove();

// Events
el.addEventListener("click", (e) => {
  console.log("Clicked!", e.target);
});

// Event delegation — attach one listener to a parent, handle child clicks
document.querySelector("ul").addEventListener("click", (e) => {
  if (e.target.tagName === "LI")
    console.log("List item clicked:", e.target.textContent);
});
```

**Event bubbling vs capturing:** events bubble up from target to ancestors by default. `addEventListener(type, fn, true)` uses the capturing phase (top-down) instead.

```js
e.stopPropagation(); // stops the event from bubbling further
e.preventDefault(); // stops default browser behavior (e.g. form submit)
```
