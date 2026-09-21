# Q1: What is the purpose of CSS Custom Properties (Variables), and how do they differ from preprocessor variables (Sass)?

## Answer

**CSS Custom Properties:** Run natively inside the browser. They are written using a double-dash format (`--main-color: #3490dc;`) and accessed via `var(--main-color)`.

Because they live in the browser, they can be dynamically updated in real time using JavaScript or changed inside media queries.

**Sass Variables:** Written using a dollar-sign format (`$main-color: #3490dc;`). They are processed during the build process before reaching the browser, meaning they become static CSS values and cannot change dynamically at runtime.

---

# Q2: How do you center a div horizontally and vertically?

## Answer

There are two modern, reliable ways to center a `div`.

### Method 1: Using Flexbox

```css
.parent {
  display: flex;
  justify-content: center; /* Horizontal centering */
  align-items: center; /* Vertical centering */
  height: 100vh;
}
```

### Method 2: Using CSS Grid

```css
.parent {
  display: grid;
  place-items: center;
  height: 100vh;
}
```

Both methods center the child element horizontally and vertically.
