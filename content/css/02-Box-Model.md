### Q1: Explain the CSS Box Model and how `box-sizing: border-box` changes it.

**Answer:**
Every HTML element is treated as a rectangular box. The box model consists of four layers from inside out: **Content**, **Padding**, **Border**, and **Margin**.

┌───────────────────────────────────────────────┐
│ MARGIN │
│ ┌───────────────────────────────────────┐ │
│ │ BORDER │ │
│ │ ┌───────────────────────────────┐ │ │
│ │ │ PADDING │ │ │
│ │ │ ┌───────────────────────┐ │ │ │
│ │ │ │ CONTENT │ │ │ │
│ │ │ └───────────────────────┘ │ │ │
│ │ └───────────────────────────────┘ │ │
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

- **`content-box` (Default):** Width and height apply only to the content. If you set a box to `width: 300px`, `padding: 20px`, and `border: 5px`, the browser renders a total physical width of **350px** ($300 + 20 + 20 + 5 + 5$).
- **`border-box`:** Width and height apply to everything up to the border. If you set `width: 300px`, padding and borders expand _inward_. The total physical width remains exactly **300px**, making responsive layouts much cleaner to calculate.

```css
/* Recommended industry standard reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```
