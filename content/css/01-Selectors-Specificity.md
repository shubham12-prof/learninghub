### Q1: What are the different types of CSS selectors, and what is their order of priority?

**Answer:**
CSS selectors point to the HTML elements you want to style. They fall into several major categories:

- **Universal Selector:** `*` (targets every element).
- **Type/Element Selector:** `h1`, `p`, `div`.
- **Class, Attribute, and Pseudo-class Selectors:** `.btn`, `[type="text"]`, `:hover`.
- **ID Selector:** `#header`.
- **Inline Styles:** Styles applied directly to an element via the HTML attribute (`style="..."`).

### Q2: How does CSS Specificity work, and how is it calculated?

**Answer:**
Specificity is the weight or algorithm browsers use to determine which CSS rule applies to an element when multiple rules conflict. It is calculated using a 4-part weight system matching the types of selectors used:

| Layer / Type                            | Description                     | Weight Value |
| :-------------------------------------- | :------------------------------ | :----------- |
| **Inline Styles**                       | `style="color: red;"`           | `1, 0, 0, 0` |
| **IDs**                                 | `#main-nav`                     | `0, 1, 0, 0` |
| **Classes, Attributes, Pseudo-classes** | `.card`, `[disabled]`, `:hover` | `0, 0, 1, 0` |
| **Elements & Pseudo-elements**          | `div`, `p`, `::before`          | `0, 0, 0, 1` |

> **Note on `!important`:** It isn't a selector, but it overrides all other specificity rules. Overusing `!important` makes debugging difficult and should generally be avoided unless overriding inline styles from external libraries.
