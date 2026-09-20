# 07. GitHub Pages

## What is GitHub Pages?

GitHub Pages is a free static site hosting service built directly into GitHub — it takes files from a repository (HTML/CSS/JS, or the output of a static site generator) and serves them as a live website, with zero separate hosting infrastructure to manage.

```
Repository files -> GitHub Pages -> https://username.github.io/repo-name/
```

## Two Types of GitHub Pages Sites

### User/Organization Site

```
Repository name MUST be: username.github.io  (exactly matching your GitHub username)
URL:                      https://username.github.io
Only ONE per account
```

### Project Site

```
Any repository name, e.g., "my-cool-project"
URL:  https://username.github.io/my-cool-project/
Unlimited — one per repository
```

## Enabling GitHub Pages

```
Repository -> Settings -> Pages
  Source: choose a branch (e.g., main, or a dedicated gh-pages branch) and folder (/ root or /docs)
```

```bash
# Alternative: deploy via GitHub Actions (more flexible, supports build steps)
```

## Serving a Static Site Directly (No Build Step)

For a plain HTML/CSS/JS site with no build process, just commit the files and point Pages at the branch/folder containing them.

```
repo/
├── index.html
├── style.css
└── script.js
```

```
Settings -> Pages -> Source: main branch, / (root) folder
-> live at https://username.github.io/repo-name/
```

## Serving from the `/docs` Folder

A common convention: keep source code at the repo root, but publish only a specific `/docs` subfolder as the live site — useful for documentation sites living alongside the actual project code.

```
repo/
├── src/              <- actual application source code
├── docs/               <- gets published as the live site
│   ├── index.html
│   └── assets/
└── package.json
```

## Deploying a Built Site via GitHub Actions (Common for Modern Frameworks)

For sites built with a static site generator or frontend framework (React, Vue, Vite, Next.js static export, Jekyll, Hugo, Docusaurus), a build step is needed before deployment — GitHub Actions automates this.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

This workflow: checks out the code, installs dependencies, runs the build, and deploys the resulting static output — triggered automatically on every push to `main`.

## Jekyll — GitHub Pages' Native Static Site Generator

GitHub Pages has built-in, zero-configuration support for Jekyll (a Ruby-based static site generator) — you can write Markdown content, and GitHub automatically builds and serves it as HTML without needing a custom GitHub Actions workflow at all.

```
repo/
├── _config.yml          <- Jekyll configuration
├── _posts/                 <- blog posts, written in Markdown
│   └── 2026-07-20-my-first-post.md
├── index.md
└── _layouts/
    └── default.html
```

```yaml
# _config.yml
title: My Project Blog
theme: minima
```

Simply committing and pushing Jekyll-structured content is enough — GitHub's Pages infrastructure automatically detects and builds it, no workflow file needed for this specific path.

## Custom Domains

```
Repository -> Settings -> Pages -> Custom domain: www.example.com
```

```
# DNS configuration required at your domain registrar:
CNAME record: www.example.com -> username.github.io
# (or A records pointing to GitHub's IP addresses, for an apex/root domain)
```

```
# A CNAME file is automatically added to the repository once configured,
# recording the custom domain association
```

```
✓ Enforce HTTPS   <- GitHub automatically provisions and renews an SSL certificate
                      via Let's Encrypt for your custom domain, once DNS is verified
```

## Common Use Cases for GitHub Pages

| Use Case                                        | Fit                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Project/library documentation sites             | Excellent — very common pattern                                                     |
| Personal portfolio / resume site                | Excellent                                                                           |
| Open-source project landing pages               | Excellent                                                                           |
| Blog (via Jekyll or another static generator)   | Good                                                                                |
| Small static marketing sites                    | Good                                                                                |
| Full-stack applications with a backend/database | Not suitable — GitHub Pages only serves static files, no server-side code execution |

## GitHub Pages Limitations

```
- Static content ONLY — no server-side code, databases, or backend logic
  (client-side JavaScript calling an EXTERNAL API is fine — the API just can't
   run ON GitHub Pages itself)
- Repository size and bandwidth soft limits (generous for typical use, but not
  intended for very high-traffic commercial sites)
- Build minutes/frequency limits for GitHub Actions-based deployments (part of
  standard GitHub Actions usage limits)
```

## Practical Example: Deploying a React App's Documentation Site

```json
// package.json
{
  "homepage": "https://username.github.io/my-project",
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
```

```bash
npm install --save-dev gh-pages
npm run build
npm run deploy   # pushes the built /dist folder to a gh-pages branch, which Pages then serves
```

(This `gh-pages` npm package approach is a simpler, manual alternative to a full GitHub Actions workflow — commonly used for smaller projects.)

## Common Interview-Style Questions

- **What is GitHub Pages, and what's its core limitation?**
  A free static site hosting service built into GitHub that serves files directly from a repository; its core limitation is that it only serves static content — there's no server-side code execution, database, or backend logic support, though client-side JavaScript can still call external APIs.

- **What's the difference between a user/organization Pages site and a project Pages site?**
  A user/organization site requires a repository named exactly `username.github.io` and serves at the root domain (one per account); a project site can use any repository name and serves at `username.github.io/repo-name/` (unlimited, one per repository).

- **How do you deploy a site built with a modern frontend framework (like React or Vue) to GitHub Pages, given that Pages only serves static files?**
  Use a GitHub Actions workflow that checks out the code, installs dependencies, runs the framework's build command to produce static output, and then deploys that built output using GitHub's official Pages deployment actions — the build step happens in CI before the static result is published.

- **What is Jekyll's relationship to GitHub Pages?**
  Jekyll is a static site generator with built-in, zero-configuration support directly in GitHub Pages' infrastructure — Markdown content structured in Jekyll's conventions is automatically built and served as HTML without needing a custom build workflow, unlike other frameworks that require an explicit GitHub Actions build step.

- **How does GitHub Pages handle HTTPS for a custom domain?**
  Once a custom domain is configured and its DNS is verified (via CNAME or A records pointing to GitHub), GitHub automatically provisions and renews an SSL certificate (via Let's Encrypt) for that domain, and "Enforce HTTPS" can be enabled to require secure connections.
