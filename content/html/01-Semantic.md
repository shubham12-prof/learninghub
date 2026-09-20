# HTML Interview Preparation Guide

---

## 1. Semantic HTML

### Q1: What is Semantic HTML, and why is it important?

**Answer:**
Semantic HTML refers to the use of HTML markup that conveys the _meaning_ and structure of the content to both the browser and the developer, rather than just defining its presentation or look.

**Why it matters:**

- **Accessibility (a11y):** Screen readers and assistive technologies use these tags to navigate the page structure efficiently.
- **SEO:** Search engine crawlers use semantic tags to understand what the content is about, which helps with ranking.
- **Maintainability:** Code is much easier to read and understand for other developers compared to a "div soup" (overusing generic `<div>` tags).

### Q2: Can you explain the difference between structural tags like `<section>`, `<article>`, `<nav>`, and `<div>`?

**Answer:**

- **`<nav>`:** Reserved specifically for major blocks of navigation links.
- **`<article>`:** Represents a self-contained, independent piece of content that could be reused or distributed on its own (e.g., a blog post, a product card, or a news article).
- **`<section>`:** Represents a thematic grouping of content, typically with a heading. It is a broader grouping than an article.
- **`<div>`:** A completely non-semantic placeholder. It carries zero meaning and should only be used for CSS styling or layout purposes when no semantic tag fits.

```html
<!-- Good Semantic Structure -->
<header>
  <h1>My Blog</h1>
  <nav>
    <ul>
      <li><a href="#home">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <section>
    <h2>Recent Posts</h2>
    <article>
      <h3>Understanding Semantic HTML</h3>
      <p>Content goes here...</p>
    </article>
  </section>
</main>
<footer>
  <p>&copy; 2026 Tech Corp</p>
</footer>
```
