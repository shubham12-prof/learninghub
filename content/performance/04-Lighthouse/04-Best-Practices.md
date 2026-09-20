# Lighthouse — Best Practices

## 1. What Does the Best Practices Audit Check?

This category is a grab-bag of modern web development standards covering **security, code quality, browser API usage, and UX conventions** that don't fit neatly into Performance/Accessibility/SEO.

## 2. Key Areas & Audits

### a) Security

#### Use HTTPS

```
Audit: is-on-https
Fix: Serve all resources over HTTPS. Redirect HTTP -> HTTPS.
```

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

#### Avoid Vulnerable/Outdated Libraries

```
Audit: no-vulnerable-libraries
Fix: Keep dependencies updated; run `npm audit` regularly.
```

```bash
npm audit
npm audit fix
```

#### Safe `target="_blank"` Links

```html
<!-- BAD: security risk (reverse tabnabbing) -->
<a href="https://external.com" target="_blank">Link</a>

<!-- GOOD -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer"
  >Link</a
>
```

#### Content Security Policy (CSP)

```
Audit: csp-xss
Fix: Add a Content-Security-Policy header to mitigate XSS attacks.
```

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none';
```

```js
// Express example
const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted-cdn.com"],
      objectSrc: ["'none'"],
    },
  }),
);
```

#### Avoid Deprecated/Dangerous APIs

```js
// BAD: document.write blocks parsing and is deprecated
document.write('<script src="analytics.js"></script>');

// GOOD
const script = document.createElement("script");
script.src = "analytics.js";
script.async = true;
document.head.appendChild(script);
```

### b) Browser Compatibility & Errors

#### No Browser Console Errors

```
Audit: errors-in-console
Fix: Fix uncaught JS exceptions and failed network requests logged to console.
```

#### Correct Image Aspect Ratio

```html
<!-- BAD: distorted image due to mismatched width/height ratio -->
<img src="photo.jpg" width="400" height="600" />

<!-- GOOD: matches natural aspect ratio -->
<img src="photo.jpg" width="400" height="300" />
```

#### Correctly Sized Images (avoid blurry/pixelated display)

```html
<img src="photo-800w.jpg" width="400" height="300" alt="..." />
<!-- Serving an 800w image at 400 display width wastes bandwidth;
     serving a smaller image than displayed causes blurriness -->
```

### c) User Experience Conventions

#### Avoid Unload Event Listeners (breaks back/forward cache)

```js
// BAD - blocks bfcache (back-forward cache)
window.addEventListener("unload", () => {
  /* ... */
});

// GOOD - use pagehide or visibilitychange instead
window.addEventListener("pagehide", () => {
  /* ... */
});
```

#### Doctype Declaration

```html
<!-- Ensures standards mode rendering, not quirks mode -->
<!DOCTYPE html>
<html lang="en"></html>
```

#### Charset Declared Early

```html
<head>
  <meta charset="UTF-8" />
  <!-- should be within first 1024 bytes of the document -->
</head>
```

#### No Geolocation/Notification Permission Requests on Page Load

```js
// BAD: asking immediately, without user context/trigger
navigator.geolocation.getCurrentPosition(success, error);

// GOOD: request only after explicit user action
locateButton.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(success, error);
});
```

## 3. Full Best Practices Checklist

| Audit                                | Check                                                    |
| ------------------------------------ | -------------------------------------------------------- |
| `is-on-https`                        | All resources served over HTTPS                          |
| `no-vulnerable-libraries`            | No known-vulnerable JS libraries                         |
| `csp-xss`                            | Content-Security-Policy mitigates XSS                    |
| `external-anchors-use-rel-noopener`  | `target="_blank"` links use `rel="noopener"`             |
| `errors-in-console`                  | No browser console errors                                |
| `image-aspect-ratio`                 | Images displayed with correct aspect ratio               |
| `image-size-responsive`              | Images sized appropriately for display                   |
| `doctype`                            | Valid `<!DOCTYPE html>` present                          |
| `charset`                            | Charset declared correctly and early                     |
| `js-libraries`                       | Detects JS library versions in use                       |
| `notification-on-start`              | No unsolicited notification permission prompts           |
| `geolocation-on-start`               | No unsolicited geolocation permission prompts            |
| `password-inputs-can-be-pasted-into` | Password fields allow pasting (password manager UX)      |
| `deprecations`                       | No use of deprecated browser APIs                        |
| `third-party-cookies`                | Flags reliance on third-party cookies (being phased out) |

## 4. Running Best Practices Audit

```bash
lighthouse https://example.com --only-categories=best-practices --view
```

```js
const runnerResult = await lighthouse(url, {
  onlyCategories: ["best-practices"],
});
console.log(runnerResult.lhr.categories["best-practices"].score * 100);
```

## 5. Example: Helmet.js for Multiple Security Best Practices at Once (Express)

```js
const helmet = require("helmet");
const app = require("express")();

app.use(helmet()); // sets sane defaults: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, etc.

app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year, in seconds
    includeSubDomains: true,
    preload: true,
  }),
);
```

## 6. Best Practices Summary

1. Always serve over HTTPS; redirect HTTP requests.
2. Keep third-party libraries patched; run `npm audit` in CI.
3. Add `rel="noopener noreferrer"` on all `target="_blank"` links.
4. Set a Content-Security-Policy header.
5. Fix all console errors before shipping.
6. Declare `<!DOCTYPE html>` and `<meta charset="UTF-8">` correctly.
7. Don't request permissions (geolocation, notifications) without user-initiated context.
8. Avoid `unload` listeners; prefer `pagehide`/`visibilitychange` to preserve bfcache eligibility.
