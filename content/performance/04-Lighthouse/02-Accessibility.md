# Lighthouse — Accessibility

## 1. What Does the Accessibility Audit Check?

Lighthouse's Accessibility category runs automated checks based on **axe-core** (Deque's accessibility engine) to catch common WCAG (Web Content Accessibility Guidelines) violations. It covers roughly 30-57 points of automated checks, but **note: passing 100 does NOT guarantee full accessibility** — manual testing (screen readers, keyboard nav) is still required.

```
Lighthouse Accessibility Score = weighted average of pass/fail audits
(NOT a percentage of WCAG compliance — automated tools only catch ~30-40% of issues)
```

## 2. Major Categories of Checks

### a) Names and Labels

Every interactive element needs an accessible name.

```html
<!-- BAD: icon button with no accessible name -->
<button><svg>...</svg></button>

<!-- GOOD -->
<button aria-label="Close dialog"><svg>...</svg></button>

<!-- BAD: image with no alt text -->
<img src="chart.png" />

<!-- GOOD -->
<img src="chart.png" alt="Bar chart showing sales growth from Jan to June" />

<!-- Decorative image - explicitly empty alt so screen readers skip it -->
<img src="decorative-line.png" alt="" />
```

```html
<!-- Form inputs need labels -->
<!-- BAD -->
<input type="text" placeholder="Email" />

<!-- GOOD -->
<label for="email">Email</label>
<input type="text" id="email" name="email" />

<!-- Or wrap it -->
<label>
  Email
  <input type="text" name="email" />
</label>
```

### b) Contrast

Text must have sufficient contrast against its background (WCAG AA: 4.5:1 for normal text, 3:1 for large text).

```css
/* BAD - low contrast */
.text {
  color: #999999;
  background: #ffffff;
} /* ~2.85:1 - fails */

/* GOOD */
.text {
  color: #595959;
  background: #ffffff;
} /* ~7:1 - passes AA and AAA */
```

Use Chrome DevTools' color picker or online contrast checkers to verify.

### c) Semantic HTML / ARIA

```html
<!-- BAD: div soup, no semantics -->
<div onclick="submitForm()">Submit</div>

<!-- GOOD: use native elements -->
<button type="submit">Submit</button>

<!-- BAD: no landmark structure -->
<div id="header">...</div>
<div id="nav">...</div>
<div id="main">...</div>

<!-- GOOD: semantic landmarks -->
<header>...</header>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<footer>...</footer>
```

```html
<!-- ARIA only when native HTML can't do it -->
<div
  role="button"
  tabindex="0"
  onKeyDown="handleKey(event)"
  onClick="handleClick()"
>
  Custom Button
</div>
<!-- Better: just use <button> which gets keyboard support, role, and focus for free -->
```

### d) Heading Structure

```html
<!-- BAD: skips levels, multiple h1s -->
<h1>Page Title</h1>
<h3>Section</h3>

<!-- GOOD: logical, sequential nesting -->
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### e) Keyboard Navigation & Focus

```css
/* BAD: never remove focus outline without replacement */
*:focus {
  outline: none;
}

/* GOOD: custom but visible focus style */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

```html
<!-- Ensure custom widgets are keyboard operable -->
<div
  role="button"
  tabindex="0"
  aria-pressed="false"
  onkeydown="if(event.key==='Enter'||event.key===' ') toggle()"
  onclick="toggle()"
>
  Toggle
</div>
```

### f) Form Validity

```html
<input
  type="email"
  id="email"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Please enter a valid email</span>
```

## 3. Common Lighthouse Accessibility Audits

| Audit                 | Fix                                                    |
| --------------------- | ------------------------------------------------------ |
| `image-alt`           | Add meaningful `alt` text (or `alt=""` for decorative) |
| `button-name`         | Ensure buttons have visible text or `aria-label`       |
| `color-contrast`      | Increase contrast ratio to meet WCAG AA                |
| `document-title`      | Every page needs a unique `<title>`                    |
| `html-has-lang`       | `<html lang="en">`                                     |
| `label`               | Every input needs an associated `<label>`              |
| `link-name`           | Links need discernible text (not just "click here")    |
| `aria-*-valid-attr`   | ARIA attributes must be valid/spelled correctly        |
| `tabindex`            | Avoid `tabindex > 0` (breaks natural tab order)        |
| `duplicate-id-active` | No duplicate IDs on focusable elements                 |

## 4. Testing with Code

### axe-core in Automated Tests (Jest example)

```bash
npm install --save-dev jest-axe
```

```js
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

test("homepage has no accessibility violations", async () => {
  const { container } = render(<HomePage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Lighthouse CI for Accessibility Gating

```js
// lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
  },
};
```

## 5. What Lighthouse CANNOT Catch (Manual Testing Needed)

- Logical reading order for screen readers
- Whether alt text is actually _meaningful_ (only checks it exists)
- Focus order matching visual order
- Whether custom components truly work with screen readers (NVDA, JAWS, VoiceOver)
- Content meaning/context for cognitive accessibility

## 6. Best Practices

1. Use semantic HTML first — reach for ARIA only when native elements can't do the job.
2. Every image needs `alt` (empty string for decorative).
3. Every form field needs a linked `<label>`.
4. Maintain a logical heading hierarchy (`h1` → `h2` → `h3`, no skipping).
5. Never remove focus indicators without a replacement.
6. Test contrast ratios (WCAG AA minimum: 4.5:1 normal text, 3:1 large text/UI components).
7. Test with an actual screen reader occasionally (VoiceOver on Mac, NVDA on Windows) — automated tools miss real UX issues.
8. Add accessibility checks to CI (`jest-axe`, Lighthouse CI) to prevent regressions.
