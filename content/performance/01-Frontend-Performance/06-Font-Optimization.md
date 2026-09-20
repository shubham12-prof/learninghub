# 06. Font Optimization

## Why Font Optimization Matters

Web fonts are render-blocking by nature in many default configurations — if the browser waits for a custom font file to download before displaying any text at all, users see a blank page (or invisible text) for longer than necessary. Font loading strategy directly affects perceived load speed and specific Core Web Vitals.

```
Default (unoptimized) behavior:  browser hides text ("Flash of Invisible Text" / FOIT) until
                                   the custom font finishes downloading — text is invisible
                                   for potentially seconds on a slow connection
```

## `font-display` — Controlling Font Loading Behavior

The single most impactful, simplest font optimization — controls what happens to text while a custom font is still loading.

```css
@font-face {
  font-family: "MyCustomFont";
  src: url("/fonts/my-font.woff2") format("woff2");
  font-display: swap;
}
```

| Value      | Behavior                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto`     | Browser default (often similar to `block`)                                                                                                                                   |
| `block`    | Hide text briefly (up to ~3s), then show fallback if the font hasn't loaded — can cause FOIT                                                                                 |
| `swap`     | Show fallback font IMMEDIATELY, swap to the custom font once loaded — avoids invisible text, but can cause a visible font swap/layout shift                                  |
| `fallback` | Very brief invisible period, then fallback shown, with a SHORT window to still swap to the custom font if it loads quickly                                                   |
| `optional` | Similar to fallback, but the browser may decide NOT to use the custom font at all if it doesn't load quickly enough (e.g., on a slow connection), avoiding any swap entirely |

```
FOIT (Flash of Invisible Text):   text is invisible while waiting for the font  — bad for perceived performance
FOUT (Flash of Unstyled Text):      fallback font shown immediately, swaps once custom font loads — generally
                                      preferred over FOIT, since users can at least READ the content immediately
```

**Practical guidance:** `font-display: swap` is a strong, simple default for most content — prioritizing readability (something visible immediately) over pixel-perfect typography from the very first paint.

## Preloading Critical Fonts

For fonts used in critical, above-the-fold content, explicitly preloading tells the browser to fetch the font file with high priority, before it would otherwise be discovered via CSS parsing.

```html
<link
  rel="preload"
  href="/fonts/my-font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

```
Without preload:  browser must first download/parse the CSS, THEN discover the @font-face rule,
                   THEN start fetching the font file — a delayed, sequential process
With preload:       the font file fetch starts IMMEDIATELY, in parallel with CSS/HTML parsing
```

Only preload fonts genuinely critical to the initial view — preloading too many fonts (or non-critical ones) competes for bandwidth/priority against other genuinely critical resources.

## Font Formats — WOFF2 Is the Modern Standard

```css
@font-face {
  font-family: "MyFont";
  src:
    url("/fonts/my-font.woff2") format("woff2"),
    url("/fonts/my-font.woff") format("woff"); /* fallback for older browsers, if needed */
}
```

WOFF2 offers meaningfully better compression than older formats (WOFF, TTF, EOT) and has near-universal modern browser support — for most projects today, WOFF2 alone (without additional fallback formats) is sufficient.

## Subsetting Fonts — Only Include the Characters You Actually Need

A full font file often includes glyphs for many languages/character sets/symbols you'll never actually use. Subsetting strips the font down to only the characters your content actually requires, dramatically reducing file size.

```bash
npx glyphhanger --subset=my-font.ttf --formats=woff2 --whitelist=U+0020-007E   # basic Latin characters only
```

```
Full font file (all languages/glyphs):  200KB+
Subsetted font (Latin characters only):   20-40KB
```

For icon fonts specifically, subsetting to only the icons actually used in your application (rather than shipping an entire icon font library) can produce similarly dramatic reductions — though modern practice increasingly favors SVG icons over icon fonts for other reasons too (accessibility, styling flexibility).

## Variable Fonts — One File, Multiple Weights/Styles

Instead of separate font files for each weight (Regular, Bold, Light, etc.), a variable font contains all weights/styles in a single file, often smaller in total than loading multiple separate static weight files.

```css
@font-face {
  font-family: "MyVariableFont";
  src: url("/fonts/my-font-variable.woff2") format("woff2-variations");
  font-weight: 100 900; /* supports the FULL range within one file */
}

.bold-text {
  font-weight: 700; /* selects the corresponding weight from the SAME loaded font file */
}
```

```
Traditional approach: Regular.woff2 (40KB) + Bold.woff2 (42KB) + Light.woff2 (38KB) = 120KB total,
                        3 SEPARATE network requests

Variable font:            single-variable.woff2 (60KB) = ONE request, ALL weights available
```

## System Fonts — The Fastest Option (Zero Network Requests)

Using the operating system's native font stack entirely avoids any custom font download at all — the fastest possible option, at the cost of giving up custom brand typography.

```css
body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}
```

For projects where brand-specific typography isn't a strict requirement, this is a legitimate, genuinely fast option worth considering — not every project needs a custom web font at all.

## Self-Hosting Fonts vs Third-Party Font Services

```
Third-party (e.g., Google Fonts via <link>):  simple to set up, but adds an EXTRA DNS lookup/connection
                                                 to a different domain, and cedes control over caching/loading behavior

Self-hosted (fonts served from your OWN domain):  one fewer DNS lookup/connection, full control over
                                                     caching headers, preloading, and format/subsetting
```

```html
<!-- Third-party, adds a separate connection to fonts.googleapis.com -->
<link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet" />

<!-- Self-hosted — often faster, more controllable -->
<link
  rel="preload"
  href="/fonts/roboto.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Self-hosting is increasingly the recommended approach for performance-conscious projects, trading a small amount of setup convenience for meaningfully better control and typically faster loading (avoiding the extra third-party connection overhead).

## Preventing Layout Shift from Font Swapping

When a fallback font swaps to a custom font (`font-display: swap`), differing character widths/metrics between the two fonts can cause visible layout shift as text reflows.

```css
@font-face {
  font-family: "MyFont";
  src: url("/fonts/my-font.woff2") format("woff2");
  font-display: swap;
  size-adjust: 105%; /* fine-tune the fallback's metrics to more closely match the custom font */
  ascent-override: 90%;
  descent-override: 20%;
}
```

Tools like the `next/font` module in Next.js, or the `fontaine` package, can automatically calculate and generate these metric-matching overrides, minimizing the visual "jump" when the font swap occurs.

## Common Interview-Style Questions

- **What is FOIT, and how does `font-display: swap` address it?**
  FOIT (Flash of Invisible Text) is when text remains invisible while waiting for a custom font to load; `font-display: swap` immediately shows a fallback font so text is readable right away, then swaps to the custom font once it finishes loading — trading a visible font swap for the ability to read content immediately, generally considered a better user experience.

- **Why would you preload a font file, and what's a risk of preloading too many?**
  Preloading tells the browser to fetch a critical font with high priority immediately, in parallel with CSS/HTML parsing, rather than waiting to discover it later via a `@font-face` rule — improving perceived load speed for text using that font; preloading too many fonts (or non-critical ones) competes for bandwidth/priority against other genuinely critical resources, potentially slowing down the overall page load instead of helping it.

- **What is font subsetting, and why is it particularly impactful?**
  Stripping a font file down to only the specific characters your content actually needs, rather than shipping the full set of glyphs for every language/symbol the font supports; this can reduce a font file's size dramatically (often from 200KB+ down to 20-40KB for Latin-only content), directly reducing download time.

- **What's the advantage of a variable font over separate static font files for each weight?**
  A single variable font file contains the full range of weights/styles, often resulting in a smaller total download and requiring only one network request, compared to loading multiple separate static files (Regular, Bold, Light, etc.) each requiring its own request.

- **Why might self-hosting fonts be preferred over loading them from a third-party service like Google Fonts?**
  Self-hosting avoids the extra DNS lookup and connection overhead of a separate third-party domain, and gives you full control over caching headers, preloading, and format/subsetting — generally resulting in faster, more predictable font loading compared to relying on an external service's `<link>` tag.
