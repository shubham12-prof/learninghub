# 11. Static Files

## What Are Static Files?

Static files are assets that don't change per-request: HTML, CSS, client-side JS, images, fonts, videos, PDFs, etc. Express provides a built-in middleware, `express.static()`, to serve these directly from a folder without writing individual routes.

## Basic Usage

```js
const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.listen(3000);
```

Given this folder structure:

```
project/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── images/
│       └── logo.png
└── app.js
```

These are now accessible directly:

- `http://localhost:3000/index.html`
- `http://localhost:3000/css/style.css`
- `http://localhost:3000/images/logo.png`

> Always use `path.join(__dirname, 'public')` rather than a relative string like `'public'` — this avoids issues depending on where the process is launched from.

## Serving Under a Virtual Path Prefix

```js
app.use("/static", express.static(path.join(__dirname, "public")));
```

Now `public/style.css` is served at `http://localhost:3000/static/style.css`. The folder name (`public`) does **not** appear in the URL — only the mount path (`/static`) does.

## Multiple Static Directories

You can mount several static folders; Express checks them in the order they're registered.

```js
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "uploads")));
```

## Serving an `index.html` for the Root Path

If `public/index.html` exists, requesting `/` automatically serves it (default behavior — configurable via the `index` option).

```js
app.use(
  express.static(path.join(__dirname, "public"), {
    index: "home.html", // serve public/home.html for '/' instead of index.html
  }),
);
```

## Useful `express.static()` Options

```js
app.use(
  express.static("public", {
    dotfiles: "ignore", // 'allow' | 'deny' | 'ignore' — how to treat files starting with "."
    etag: true, // enable/disable etag generation
    extensions: ["html"], // fallback extensions, e.g. /about -> /about.html
    index: "index.html", // default file to serve for a directory
    maxAge: "1d", // Cache-Control max-age (e.g., '1d', 86400000 ms)
    redirect: true, // redirect to trailing "/" when a directory is requested
    setHeaders: (res, filePath) => {
      res.set("X-Custom-Header", "value");
    },
  }),
);
```

### Extension Fallback Example

```js
app.use(express.static("public", { extensions: ["html", "htm"] }));
```

A request to `/about` will now also match `public/about.html` if it exists.

## Caching Static Assets

```js
app.use(
  express.static("public", {
    maxAge: "30d", // browsers cache for 30 days
    etag: true,
  }),
);
```

For production apps, it's common to serve static files through a CDN or reverse proxy (Nginx, CloudFront) rather than directly through Node — Express's static serving is fine for development and small-scale production.

## Serving a Single-Page Application (SPA)

For SPAs (React, Vue, etc.), serve the built `dist`/`build` folder and fall back to `index.html` for any unmatched route (so client-side routing works):

```js
app.use(express.static(path.join(__dirname, "client/build")));

// Must come after API routes, and after express.static
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});
```

> In Express 5, wildcard route matching changed — prefer:
>
> ```js
> app.get("/{*splat}", (req, res) => {
>   res.sendFile(path.join(__dirname, "client/build", "index.html"));
> });
> ```

## Serving a File Manually with `res.sendFile()`

Instead of a whole folder, you can serve individual files by route:

```js
app.get("/download-logo", (req, res) => {
  res.sendFile(path.join(__dirname, "public/images/logo.png"));
});
```

## Security Considerations

- Never point `express.static()` at a directory containing sensitive files (`.env`, source code, credentials) — everything inside is publicly downloadable.
- Use `dotfiles: 'deny'` (or the default `'ignore'`) to avoid serving hidden config files like `.env` or `.git`.
- Combine with `helmet` to set safe caching/security headers for static content (see **17-Helmet.md**).

## Common Interview-Style Questions

- **How do you serve static files in Express?**
  `app.use(express.static('folderName'))`, mounting the middleware; files inside become directly accessible by their relative path.

- **Does the folder name appear in the URL?**
  No — only the mount path (if any) appears in the URL, not the physical folder name.

- **How would you serve a React production build with Express?**
  `app.use(express.static(path.join(__dirname, 'build')))` plus a catch-all route serving `index.html` for client-side routes, placed after API routes.

- **How do you set browser caching for static assets?**
  Pass the `maxAge` option to `express.static()`.
