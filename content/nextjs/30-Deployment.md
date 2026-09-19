# Deployment

Next.js apps can be deployed to Vercel (the platform built by the same team, with zero-config support for every Next.js feature) or self-hosted on any Node.js-capable infrastructure.

**Deploying to Vercel (simplest path, first-class support for all Next.js features):**

```bash
npm install -g vercel
vercel          # deploy to a preview URL
vercel --prod       # deploy to production
```

Vercel automatically handles ISR, Edge Middleware, Image Optimization, and Server Actions with zero extra configuration — since these features were largely co-designed with Vercel's infrastructure.

**Self-hosting with Node.js — the standard production build/start flow:**

```bash
npm run build    # creates an optimized production build in .next/
npm run start        # starts a Node.js server serving that build
```

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

**Docker deployment (common for self-hosted/containerized infrastructure):**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

**Static export — for apps with NO server-side features (no SSR, Server Actions, or Image Optimization API), deployable to any static host (S3, GitHub Pages, Netlify's static hosting):**

```js
// next.config.js
module.exports = { output: "export" };
```

```bash
npm run build   # generates a fully static `out/` directory
```

**Deployment platform tradeoffs:**

|                                         | Vercel                                 | Self-hosted Node                                                      | Static export                       |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| Setup effort                            | minimal, zero-config                   | moderate — manage your own server/infra                               | minimal, but very limited features  |
| Supports ISR/Server Actions/Middleware? | Yes, natively                          | Yes, but you manage the infrastructure                                | No — static only                    |
| Best for                                | most teams, fastest path to production | teams needing infra control, specific compliance/hosting requirements | purely static marketing sites, docs |

**Interview note:** a common interview question is "why would you self-host instead of using Vercel?" — reasonable answers include cost at very large scale, data residency/compliance requirements, existing infrastructure/DevOps investment, or wanting a single deployment pipeline across multiple frameworks/services rather than a Next.js-specific platform.
