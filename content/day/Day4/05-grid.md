# 05 - CSS Grid and Responsive Design

> **Time to learn:** ~50 min | **Level:** Core concept | **Interview frequency:** Very high
> Flexbox = one dimension. **Grid = rows AND columns at the same time.** Read `04-flexbox.md` first.

## 1. What is Grid?

Make a parent a **grid container**, define **columns** (and optionally rows), and its direct children are placed into the cells.

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* three equal columns */
  gap: 1rem;
}
```

## 2. Analogy

A **spreadsheet** laid over the page. Flexbox is a single shelf; Grid is a whole bookcase where rows and columns line up.

## 3. Core properties

| Property                            | Does                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `display: grid`                     | creates the grid                                                  |
| `grid-template-columns`             | defines the columns                                               |
| `grid-template-rows`                | defines rows (usually left to **auto**: rows grow to fit content) |
| `gap` (`row-gap`, `column-gap`)     | space between cells                                               |
| `grid-column: span 2`               | an item spans 2 columns                                           |
| `grid-template-areas`               | name regions and place items by name                              |
| `justify-items` / `align-items`     | align content **inside each cell** (horizontal / vertical)        |
| `justify-content` / `align-content` | position the **whole grid** inside the container                  |

### The `fr` unit

`fr` = a **fraction of the leftover space**.

```css
grid-template-columns: 1fr 2fr; /* second column twice as wide as the first */
grid-template-columns: 240px 1fr; /* fixed sidebar + flexible content */
grid-template-columns: repeat(3, 1fr); /* same as 1fr 1fr 1fr */
```

## 4. The responsive card grid (the most important snippet of the day)

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}
```

Read it as: "make **as many columns as fit**, each **at least 16rem** wide and **at most an equal share** of the free space."

- Narrow phone: 1 column. Tablet: 2-3 columns. Desktop: 4+ columns.
- **No media queries needed.**

### `auto-fill` vs `auto-fit`

Both create as many columns as fit. They differ **when there are fewer items than columns**:

|             | Empty tracks                | Result with 2 cards in a wide container                            |
| ----------- | --------------------------- | ------------------------------------------------------------------ |
| `auto-fill` | **kept** (as empty columns) | cards stay at ~`16rem` (a column's width), the rest is empty space |
| `auto-fit`  | **collapsed to 0**          | the 2 cards **stretch** to fill the whole row                      |

Pick **`auto-fill`** when you want cards to keep a consistent size, **`auto-fit`** when you want few items to expand.

### Avoiding overflow on tiny screens: `min(…, 100%)`

If a container is narrower than `16rem` (320px phones with padding), a fixed `minmax(16rem, 1fr)` forces horizontal scroll. Fix:

```css
grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
```

### `1fr` vs `minmax(0, 1fr)`

`1fr` is really `minmax(auto, 1fr)`: a column can't be **narrower than its content**. A long unbreakable word or wide table can blow the layout out. Use `minmax(0, 1fr)` (and `overflow-wrap: anywhere`) to allow shrinking. (Same idea as `min-width: 0` in Flexbox.)

## 5. Placing items

```css
.hero {
  grid-column: 1 / -1;
} /* from first line to last line: full width */
.wide {
  grid-column: span 2;
} /* span two columns */
.tall {
  grid-row: span 2;
}
```

### Named areas (great for page layouts)

```css
.page {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  min-height: 100vh;
}
header {
  grid-area: header;
}
nav {
  grid-area: nav;
}
main {
  grid-area: main;
}
footer {
  grid-area: footer;
}
```

Make it responsive by redefining the template on small screens:

```css
@media (max-width: 40rem) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "nav" "main" "footer";
  }
}
```

## 6. Flexbox vs Grid: which do I pick?

| Use **Flexbox** when...                                                 | Use **Grid** when...                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Content is laid out in **one line** (navbar, toolbar, button row, tags) | You need **rows and columns** to line up (card gallery, dashboard, page layout) |
| Size is driven by the **content**                                       | Layout is driven by the **container / template**                                |
| You want items to wrap but don't care about column alignment            | Every row must align with the one above                                         |
| Distributing space **between** items                                    | Placing items in **specific cells/areas**                                       |

They combine well: **Grid for the page and card gallery, Flexbox inside each card or navbar.** "Use Grid for layout, Flexbox for components" is a good rule of thumb.

## 7. Responsive design essentials

### 7.1 The viewport meta tag (mobile)

Without it, phones pretend to be ~980px wide and shrink everything:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### 7.2 Mobile first + `min-width` media queries

Write the **small-screen** styles first, then enhance for larger screens.

```css
.layout {
  display: grid;
  gap: 1rem;
} /* mobile: single column */

@media (min-width: 48rem) {
  /* tablet and up */
  .layout {
    grid-template-columns: 220px 1fr;
  }
}
```

Breakpoints should follow **where your content breaks**, not specific device models. Common starting points: `40rem` (640px), `48rem` (768px), `64rem` (1024px).

### 7.3 Flexible units

| Unit                         | Use                                                               |
| ---------------------------- | ----------------------------------------------------------------- |
| `rem`                        | font sizes and spacing (respects the user's font-size setting)    |
| `%`, `fr`                    | widths in flexible layouts                                        |
| `vw`, `vh`, `dvh`            | viewport-relative (use `dvh` on mobile to account for browser UI) |
| `clamp(min, preferred, max)` | fluid values, e.g. `font-size: clamp(1rem, 2.5vw, 1.5rem)`        |
| `ch`                         | readable line length, e.g. `max-width: 65ch`                      |
| `px`                         | hairlines/borders; avoid for text sizes                           |

### 7.4 Images

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}
.thumb {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 100%;
}
```

### 7.5 Container queries (modern)

Style a component based on **its container's width**, not the viewport:

```css
.card-wrap {
  container-type: inline-size;
}
@container (min-width: 28rem) {
  .card {
    display: flex;
    gap: 1rem;
  } /* horizontal card when there's room */
}
```

### 7.6 Don't disable zoom, support text resizing

Layout must still work at **200% zoom** and at **320px** wide (WCAG reflow). Test it.

## 8. Common mistakes

1. Using Flexbox with `flex-wrap` for a card gallery and getting a **misaligned last row** (use Grid).
2. `repeat(3, 1fr)` with no breakpoints -> three crushed columns on phones (use `auto-fill` + `minmax`).
3. `minmax(16rem, 1fr)` forcing horizontal scroll below 16rem (use `min(16rem, 100%)`).
4. Confusing `auto-fill` and `auto-fit`.
5. Fixed pixel `width`/`height` on containers and text.
6. Forgetting the **viewport meta tag**.
7. Using desktop-first `max-width` queries everywhere and overriding endlessly (prefer mobile-first).
8. Using `grid-template-areas` for the layout and then reordering visually so it no longer matches the DOM/tab order.

## 9. Predict the output

Grid container width = **1000px**, `gap: 0` unless stated, no padding.

**Q1** `grid-template-columns: 1fr 2fr;` What are the column widths?

**Q2** `grid-template-columns: 200px 1fr 1fr;` What are the widths?

**Q3** `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));` with 7 items. How many columns and how wide is each?

**Q4** Same as Q3 but with **only 2 items**. What are the column widths for `auto-fill`? And for `auto-fit`?

**Q5** `grid-template-columns: repeat(3, 1fr); gap: 20px;` How wide is each column?

## 10. Answers

- **Q1:** **333.33px** and **666.67px**.
- **Q2:** **200px**, **400px**, **400px** (the remaining 800px is split by `fr`).
- **Q3:** `floor(1000 / 300)` = **3 columns**; the free space is shared, so each is **333.33px**.
- **Q4:** `auto-fill`: **333.33px** per column (3 tracks exist, the third stays empty, so the 2 cards are 333.33px each). `auto-fit`: the empty track collapses, so the 2 cards stretch to **500px** each.
- **Q5:** Total gap = 2 x 20 = 40px, so (1000 - 40) / 3 = **320px**.

## Recap

- **Grid = 2D** (rows and columns); **Flexbox = 1D**. Use Grid for layouts and galleries, Flexbox for rows inside components.
- `fr` = share of free space; `repeat(auto-fill, minmax(16rem, 1fr))` = responsive columns with no media queries.
- `auto-fit` collapses empty tracks (cards stretch); `auto-fill` keeps them.
- Mobile first, `min-width` media queries, relative units (`rem`, `%`, `fr`, `clamp`), `max-width: 100%` images, viewport meta tag.
- Guard against overflow: `min(16rem, 100%)`, `minmax(0, 1fr)`, `min-width: 0`.

## Checklist

- [ ] I can write the responsive card grid from memory
- [ ] I can explain `auto-fill` vs `auto-fit`
- [ ] I can explain when to choose Grid vs Flexbox
- [ ] I can build a header/nav/main/footer layout with `grid-template-areas`
- [ ] I got Q1 to Q5 right without looking
