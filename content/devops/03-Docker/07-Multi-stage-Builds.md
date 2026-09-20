# 07. Multi-stage Builds

## What Are Multi-stage Builds?

Multi-stage builds let a single Dockerfile use **multiple `FROM` instructions**, each starting a new build "stage." Files can be selectively copied from one stage into another, letting you use a full-featured environment (with build tools, dev dependencies, compilers) to _build_ your application, while the **final** image contains only what's actually needed to _run_ it — dramatically reducing final image size and attack surface.

```
Stage 1 ("builder"): full environment with build tools, dev dependencies -> produces build artifacts
                            │
                    COPY --from=builder (selectively copy ONLY the needed output)
                            ▼
Stage 2 ("final"):    minimal runtime environment + just the artifacts from Stage 1
                       -> this is the image that actually gets deployed
```

## The Problem Multi-stage Builds Solve

Without multi-stage builds, a single-stage Dockerfile that needs to compile/build something ends up including **everything** used during that process in the final image — build tools, dev dependencies, source files, intermediate artifacts — none of which are actually needed at runtime.

```dockerfile
# SINGLE-STAGE (bloated) — everything used to build ALSO ends up in the final image
FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install              # installs BOTH prod AND dev dependencies
COPY . .
RUN npm run build              # TypeScript compiler, build tools, etc. all remain in the final image
CMD ["node", "dist/server.js"]
```

## A Multi-stage Build Example

```dockerfile
# ---- Stage 1: Build ----
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install                  # full install, including devDependencies needed for the build
COPY . .
RUN npm run build                  # compiles TypeScript -> JavaScript, output goes to /app/dist

# ---- Stage 2: Production Runtime ----
FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production        # ONLY production dependencies this time, no dev tools needed
COPY --from=builder /app/dist ./dist   # copy JUST the compiled output from the builder stage

CMD ["node", "dist/server.js"]
```

The final image (built `FROM node:20-alpine`) never contains the TypeScript compiler, dev dependencies, or raw source files — only the compiled JavaScript output and production dependencies.

## Naming Stages with `AS`

```dockerfile
FROM node:20 AS builder
# ...

FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
```

Named stages (`AS builder`, `AS production`) make `COPY --from=` references clear and let you target specific stages when building (useful for debugging an intermediate stage without building the whole thing).

```bash
docker build --target builder -t myapp:debug .   # build ONLY up through the "builder" stage
```

## Copying From an External Image (Not Just a Previous Stage)

`COPY --from=` can also reference an entirely separate image, not just a stage defined earlier in the same Dockerfile — useful for grabbing a specific tool/binary from a purpose-built image without needing to install it yourself.

```dockerfile
COPY --from=golang:1.22 /usr/local/go/bin/go /usr/local/bin/go
```

## Real-World Example: A React Frontend Served by Nginx

```dockerfile
# ---- Stage 1: Build the React app ----
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build   # produces static files in /app/build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The final image is a lightweight Nginx server containing only static HTML/CSS/JS — no Node.js runtime, no `node_modules`, no build tooling at all. This kind of size reduction (potentially from 1GB+ down to ~25-50MB) is a very common, highly impactful real-world use of multi-stage builds.

## Real-World Example: A Go Application (Compiled Binary)

Compiled languages benefit enormously from multi-stage builds, since the final artifact is just a single binary with no runtime dependencies at all.

```dockerfile
# ---- Stage 1: Build ----
FROM golang:1.22 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# ---- Stage 2: Minimal runtime ----
FROM scratch AS production
# "scratch" is a completely EMPTY base image — literally nothing in it

COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

`FROM scratch` — an entirely empty base image — is possible here specifically because a statically-compiled Go binary (`CGO_ENABLED=0`) has zero external runtime dependencies. This produces an extraordinarily minimal final image (potentially just a few MB) containing literally nothing but the compiled binary.

## Multi-stage Builds for Testing

A common additional pattern: use a dedicated stage specifically for running tests during the build, without that stage's contents (or a failed test run) ever reaching the final production image.

```dockerfile
FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM base AS test
RUN npm test   # if tests fail, the ENTIRE BUILD fails here — a built-in quality gate

FROM base AS build
RUN npm run build

FROM node:20-alpine AS production
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]
```

```bash
docker build --target test -t myapp:test .   # run just the test stage, e.g., in CI
docker build --target production -t myapp:prod .   # build the actual deployable image
```

## Benefits of Multi-stage Builds — Summary

```
Smaller final images  -> faster deploys, pulls, less storage/bandwidth
Reduced attack surface  -> no compilers, dev tools, or source maps in production
Simpler CI/CD             -> one Dockerfile handles build, test, AND produces the final artifact,
                              rather than needing separate build scripts/pipelines
No need for separate       -> avoids maintaining two different Dockerfiles (one for building,
"build" and "runtime"          one for the final runtime image) that could drift out of sync
Dockerfiles
```

## Common Interview-Style Questions

- **What problem do multi-stage builds solve?**
  Without them, any tools/dependencies used during a build process (compilers, dev dependencies, source files) end up baked into the final image even though they're not needed at runtime, bloating image size and increasing attack surface; multi-stage builds let you use a full build environment in an early stage while copying only the necessary output artifacts into a minimal final stage.

- **How do you copy files from one build stage into another?**
  Using `COPY --from=<stage-name>` (or a stage index), referencing a named stage defined earlier in the Dockerfile with `AS <name>` — this selectively brings over only the specified files/directories, not the entire earlier stage's filesystem.

- **Why might you use `FROM scratch` as a final stage's base image?**
  For statically-compiled binaries (e.g., a Go binary built with `CGO_ENABLED=0`) that have zero external runtime dependencies — `scratch` is a completely empty base image, producing the smallest possible final image containing literally nothing but the compiled binary itself.

- **How can multi-stage builds be used to integrate testing into the build process itself?**
  By defining a dedicated stage that runs the test suite (e.g., `RUN npm test`); if tests fail, the entire Docker build fails at that stage, acting as a built-in quality gate — and that testing stage's contents never need to be copied into or affect the final production stage.

- **What's a typical real-world size reduction achievable with multi-stage builds, and give an example scenario.**
  Very significant — e.g., a React frontend built and then served via a minimal Nginx image can shrink from over 1GB (if the Node.js build environment and all dependencies were included) down to roughly 25-50MB, since the final image only needs the static build output and a lightweight web server, not the Node.js runtime or any build tooling at all.
