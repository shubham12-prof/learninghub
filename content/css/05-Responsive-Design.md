### Q1: What is a Mobile-First approach, and how does it affect media queries?

**Answer:**

Mobile-First means writing your default CSS rules for the smallest screens (mobile devices) first without any media queries. You then add media queries using min-width to progressively layer on styles as screens get wider (tablets, desktops).

Why it matters: It results in cleaner, lighter code because mobile devices don't have to parse heavy desktop styles only to overwrite them. It also matches modern responsive web layout patterns.

CSS

```css
/* Base styles applied to mobile devices */

.container {
  width: 100%;
  padding: 1rem;
}

/* Styles applied only when screen width reaches 768px or more */

@media (min-width: 768px) {
  .container {
    width: 80%;
    margin: 0 auto;
  }
}
```
