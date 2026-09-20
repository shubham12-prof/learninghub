# Lighthouse — SEO

## 1. What Does the SEO Audit Check?

Lighthouse's SEO category runs automated checks for basic **crawlability and indexability** best practices — it does NOT check rankings, backlinks, or content quality. Passing 100 means search engines _can_ crawl/understand your page, not that it will rank well.

## 2. Key SEO Audits & Fixes

### a) `document-title` — Unique, Descriptive Title

```html
<!-- BAD -->
<title>Home</title>

<!-- GOOD -->
<title>Best Running Shoes 2026 | Buy Online at ShoeStore</title>
```

### b) `meta-description`

```html
<meta
  name="description"
  content="Shop the best running shoes of 2026 with free shipping and 30-day returns. Compare top brands and find your perfect fit."
/>
```

### c) `link-text` — Descriptive Link Text

```html
<!-- BAD -->
<a href="/report.pdf">Click here</a>

<!-- GOOD -->
<a href="/report.pdf">Download the 2026 Annual Report (PDF)</a>
```

### d) `crawlable-anchors` — Links Must Be Crawlable

```html
<!-- BAD: JS-only navigation, no href, not crawlable -->
<span onclick="navigate('/products')">Products</span>

<!-- GOOD -->
<a href="/products">Products</a>
```

### e) `is-crawlable` — Not Blocked from Indexing

```html
<!-- BAD: accidentally blocks search engines -->
<meta name="robots" content="noindex" />

<!-- GOOD (if you want it indexed) -->
<meta name="robots" content="index, follow" />
```

```txt
# robots.txt - check you're not blocking important pages
User-agent: *
Disallow: /admin/
Allow: /
```

### f) `hreflang` — Valid International Targeting

```html
<link rel="alternate" hreflang="en-us" href="https://example.com/us/" />
<link rel="alternate" hreflang="en-gb" href="https://example.com/uk/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

### g) `canonical` — Valid Canonical URL

```html
<link rel="canonical" href="https://example.com/products/shoes" />
```

Prevents duplicate content issues (e.g., `?utm_source=...` query params creating "duplicate" pages).

### h) `viewport` — Mobile-Friendly Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### i) `font-size` — Legible Font Sizes

```css
/* BAD */
body {
  font-size: 10px;
}

/* GOOD - Lighthouse flags text under ~12px on mobile */
body {
  font-size: 16px;
}
```

### j) `tap-targets` — Adequately Sized & Spaced Tap Targets

```css
/* BAD: buttons too small/close together on mobile */
button {
  width: 20px;
  height: 20px;
}

/* GOOD: minimum ~48x48px recommended tap target */
button {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 16px;
}
```

### k) `structured-data` (validated separately, not scored but important)

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Running Shoe Pro",
    "image": "https://example.com/shoe.jpg",
    "description": "Lightweight running shoe with responsive cushioning",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": "89.99",
      "availability": "https://schema.org/InStock"
    }
  }
</script>
```

Structured data (JSON-LD) helps search engines show rich results (star ratings, price, breadcrumbs) in search listings.

## 3. Full SEO Audit Checklist Table

| Audit               | Requirement                                                   |
| ------------------- | ------------------------------------------------------------- |
| `document-title`    | Non-empty, unique `<title>`                                   |
| `meta-description`  | Present and non-empty                                         |
| `http-status-code`  | Page returns a valid (successful) status code                 |
| `link-text`         | Links have descriptive, non-generic text                      |
| `crawlable-anchors` | Links use real `<a href>`, crawlable by bots                  |
| `is-crawlable`      | Not blocked by `robots.txt` or `noindex`                      |
| `robots-txt`        | `robots.txt` is valid (no syntax errors)                      |
| `image-alt`         | Images have `alt` (also helps SEO, not just a11y)             |
| `hreflang`          | Valid hreflang tags if multi-language                         |
| `canonical`         | Valid, self-referencing or correctly pointed canonical tag    |
| `font-size`         | Legible font sizes (mobile-friendly)                          |
| `viewport`          | Has a responsive viewport meta tag                            |
| `tap-targets`       | Touch targets sized/spaced appropriately                      |
| `structured-data`   | Valid schema markup (manual validation via Rich Results Test) |

## 4. Running SEO Audits Programmatically

```bash
lighthouse https://example.com --only-categories=seo --output=json --output-path=./seo-report.json
```

```js
const runnerResult = await lighthouse(url, { onlyCategories: ["seo"] });
const seoScore = runnerResult.lhr.categories.seo.score * 100;
console.log("SEO Score:", seoScore);

// Inspect individual audit failures
Object.values(runnerResult.lhr.audits)
  .filter((audit) => audit.score !== null && audit.score < 1)
  .forEach((audit) => console.log(`FAILED: ${audit.title}`));
```

## 5. Common Technical SEO Issues Beyond Lighthouse

Lighthouse doesn't check everything relevant to SEO. Also verify:

- **Sitemap.xml** exists and is submitted to Search Console.
- **Core Web Vitals** (LCP, CLS, INP) — a Google ranking signal (see Metrics doc).
- **Mobile-first indexing** — Google primarily crawls the mobile version.
- **Server-side rendering / pre-rendering** for JS-heavy SPAs, since crawlers may not execute all JS reliably.
- **Duplicate content** across `www` vs non-`www`, `http` vs `https` (use redirects + canonical tags).
- **Broken links (404s)** — audit periodically with a crawler tool (e.g., Screaming Frog).

## 6. Example: Server-Side Rendering for SEO (Next.js)

```jsx
// pages/products/[id].js - Next.js SSR ensures crawlers get full HTML
export async function getServerSideProps({ params }) {
  const product = await fetchProduct(params.id);
  return { props: { product } };
}

export default function ProductPage({ product }) {
  return (
    <>
      <Head>
        <title>{product.name} | ShoeStore</title>
        <meta name="description" content={product.shortDescription} />
        <link
          rel="canonical"
          href={`https://example.com/products/${product.id}`}
        />
      </Head>
      <h1>{product.name}</h1>
      <img src={product.image} alt={product.name} />
    </>
  );
}
```

## 7. Best Practices

1. Give every page a unique, descriptive `<title>` and `<meta name="description">`.
2. Use real `<a href>` links, not JS-only click handlers, for anything crawlable.
3. Double-check `robots.txt` and `noindex` tags aren't accidentally blocking important pages.
4. Add a canonical tag on every page, even self-referencing ones.
5. Ensure mobile-friendliness: viewport meta tag, readable font sizes, adequately sized tap targets.
6. Add structured data (JSON-LD) for rich search results where applicable (products, articles, reviews, FAQs).
7. Combine Lighthouse SEO checks with Core Web Vitals monitoring — both are ranking factors.
