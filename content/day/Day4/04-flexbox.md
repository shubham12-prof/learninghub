# 04 - Flexbox

> **Time to learn:** ~45 min | **Level:** Core concept | **Interview frequency:** Very high (every UI interview)
> Flexbox lays things out along **one axis** (a row or a column). For rows **and** columns together, see `05-grid.md`.

## 1. What is Flexbox?

Turn a parent into a **flex container** and its direct children become **flex items** that you can align, space and resize along one direction.

```css
.row {
  display: flex;
}
```

Only **direct children** become flex items (not grandchildren).

## 2. Analogy

A **shelf** with books. You decide the direction (left to right or top to bottom), how the books are spread (packed left, centred, evenly spaced), and which books stretch to fill spare space.

## 3. The two axes (the key idea)

|                                 | Main axis  | Cross axis |
| ------------------------------- | ---------- | ---------- |
| `flex-direction: row` (default) | horizontal | vertical   |
| `flex-direction: column`        | vertical   | horizontal |

- **`justify-content`** aligns items along the **main** axis.
- **`align-items`** aligns items along the **cross** axis.

(Switch `flex-direction` and the two swap physical directions. Memorise "justify = main, align = cross".)

## 4. Container properties

```css
.container {
  display: flex;
  flex-direction: row; /* row | row-reverse | column | column-reverse */
  flex-wrap: wrap; /* nowrap (default) | wrap */
  justify-content: space-between; /* flex-start | center | flex-end | space-between | space-around | space-evenly */
  align-items: center; /* stretch (default) | flex-start | center | flex-end | baseline */
  gap: 1rem; /* spacing between items (use this instead of margins) */
}
```

| Property          | Does                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| `flex-direction`  | picks the main axis                                                        |
| `flex-wrap`       | lets items go to a new line instead of shrinking                           |
| `justify-content` | spreads items on the main axis                                             |
| `align-items`     | aligns items on the cross axis (default `stretch` = equal height in a row) |
| `align-content`   | spreads **lines** when wrapped                                             |
| `gap`             | space between items                                                        |

## 5. Item properties: `flex-grow`, `flex-shrink`, `flex-basis`

```css
.item {
  flex: 1 1 200px;
} /* grow | shrink | basis */
```

| Part          | Meaning                                               | Default                    |
| ------------- | ----------------------------------------------------- | -------------------------- |
| `flex-basis`  | the item's **starting size** along the main axis      | `auto` (use width/content) |
| `flex-grow`   | how much of the **leftover** space it takes (a share) | `0` (don't grow)           |
| `flex-shrink` | how much it shrinks when there isn't enough space     | `1` (can shrink)           |

Shorthands you'll see:

| Shorthand         | Means              | Use                                                 |
| ----------------- | ------------------ | --------------------------------------------------- |
| `flex: 1`         | `1 1 0`            | **share the space equally**, ignoring content width |
| `flex: auto`      | `1 1 auto`         | grow from content size                              |
| `flex: none`      | `0 0 auto`         | fixed, never resize                                 |
| `flex: 0 0 200px` | fixed 200px column | sidebar                                             |

### Example: three equal columns

```css
.col {
  flex: 1;
} /* in a 600px container: 200px each */
```

### Example: sidebar + content

```css
.sidebar {
  flex: 0 0 240px;
} /* always 240px */
.content {
  flex: 1;
} /* takes the rest */
```

### `align-self`, `order`, `margin: auto`

```css
.item {
  align-self: flex-end;
} /* override align-items for ONE item */
.badge {
  order: -1;
} /* visual order (careful: the keyboard/screen-reader order doesn't change) */
.push {
  margin-left: auto;
} /* absorbs all free space: pushes this item and the ones after it to the far end */
```

## 6. Real patterns you must be able to write

### 6.1 Perfect centring

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

### 6.2 Navbar: logo left, links right

```css
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.nav .logo {
  margin-right: auto;
} /* pushes the links to the right */
```

### 6.3 Wrapping tags / chips

```css
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

### 6.4 Sticky footer (footer at the bottom even on short pages)

```css
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1;
}
```

### 6.5 Card with the button always at the bottom

```css
.card {
  display: flex;
  flex-direction: column;
}
.card .actions {
  margin-top: auto;
} /* equal-height cards, buttons aligned */
```

### 6.6 Responsive row that stacks on mobile (no media query)

```css
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.row > * {
  flex: 1 1 16rem;
} /* each item wants 16rem; wraps when there isn't room */
```

Watch out: in a 600px container with 3 items and `gap: 1rem`, two items share the first line (292px each) and the **lone third item grows to the full 600px** on the second line, because each line distributes its own free space. That is why a card gallery should use Grid (`05-grid.md`).

## 7. The gotchas that cost interview points

1. **`min-width: 0` on flex items.** By default a flex item can't shrink below its **content's minimum size**, so long text or a wide `<pre>`/image makes the layout overflow. Add `min-width: 0` (and `overflow: hidden` or `overflow-wrap: anywhere`) to let it shrink.
2. **`flex: 1` isn't "same width as the content"**; it is `flex-basis: 0`, so items get **equal widths regardless of content**. Use `flex: auto` to start from content size.
3. **Margins vs `gap`.** `gap` doesn't add space at the outer edges; margins do.
4. **`justify-content` seems "not working"** because the item already fills the container (`flex: 1`) or the container has no extra space.
5. **Flexbox is one-dimensional.** Each wrapped line is laid out on its own, so the last line does **not** line up with the columns above it (with `flex: 1 1 150px`, five items in 640px give four items of 152.5px and then a fifth stretched to 640px). For a true grid use CSS Grid.
6. **`order` and `row-reverse` change the visual order only**, not the DOM/tab/screen-reader order (accessibility issue).
7. **`align-items: stretch` is the default** (that's why cards in a row have equal heights unless you override it).

## 8. Flexbox vs `display: block / inline`

Normal block layout stacks children vertically and gives no control over alignment or spare space. Flexbox gives you **alignment, distribution and equal sizing** without floats, `inline-block` hacks or margins.

## 9. Common mistakes

1. Setting `display: flex` on the **wrong element** (the items, not the container).
2. Mixing up `justify-content` and `align-items` after changing `flex-direction`.
3. Forgetting `flex-wrap: wrap`, so items shrink to unreadable widths instead of wrapping.
4. Using fixed `width` in px on items and fighting `flex-shrink`.
5. Using Flexbox for a 2D grid of cards (columns don't line up on the last row).
6. Forgetting `min-width: 0` -> text overflows.
7. Using `order` for important content and breaking keyboard navigation order.

## 10. Predict the output

Container: `display: flex; width: 600px; gap: 0;` (no padding/border), items have no padding.

**Q1** Three items with `flex: 1`. What is the width of each?

**Q2** Items A, B, C. A has `flex: 0 0 100px`, B and C have `flex: 1`. What are the three widths?

**Q3** Items A, B with `flex: 1` and `flex: 2`. What are their widths?

**Q4** Three items each with `width: 300px` (default `flex-shrink: 1`, `flex-wrap: nowrap`). What is each item's rendered width?

**Q5** Three items each `width: 300px` but the container has `flex-wrap: wrap`. How many items are on the first line and what is each width?

## 11. Answers

- **Q1:** **200px** each (600 / 3).
- **Q2:** A = **100px**; B = C = **250px** (the remaining 500px is shared equally).
- **Q3:** A = **200px**, B = **400px** (grow shares 1 : 2 of 600px).
- **Q4:** **200px** each. They want 900px but only 600px exists, so they **shrink** equally (`flex-shrink: 1`) to fit.
- **Q5:** **2 items** on the first line (2 x 300 = 600), the third on the second line; each stays **300px**.

## Recap

- `display: flex` on the **parent**; children become flex items on one axis.
- **`justify-content` = main axis, `align-items` = cross axis**; `flex-direction` swaps them.
- `flex: 1` = equal share ignoring content; `flex: 0 0 240px` = fixed; `margin-left: auto` pushes to the end.
- Use `gap` for spacing, `flex-wrap` for responsive wrapping, `min-width: 0` for overflow.
- Flexbox = **1D**; Grid = **2D**.

## Checklist

- [ ] I can centre a div horizontally and vertically with Flexbox
- [ ] I can explain main vs cross axis and justify vs align
- [ ] I can explain `flex: 1 1 200px` (grow, shrink, basis)
- [ ] I can build a navbar, a sticky footer and equal-height cards
- [ ] I got Q1 to Q5 right without looking
