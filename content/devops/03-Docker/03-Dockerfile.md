# 03. Dockerfile

## What is a Dockerfile?

A Dockerfile is a text file containing a sequence of instructions Docker follows to build an image — essentially a recipe describing how to assemble the environment your application needs, layer by layer.

```bash
docker build -t myapp:1.0 .   # builds an image following the instructions in ./Dockerfile
```

## A Basic Node.js Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

## Core Instructions Explained

### `FROM` — The Base Image

Every Dockerfile starts with a base image to build upon.

```dockerfile
FROM node:20-alpine
```

### `WORKDIR` — Setting the Working Directory

Sets the directory for all subsequent instructions (`COPY`, `RUN`, `CMD`, etc.) — creates the directory if it doesn't already exist.

```dockerfile
WORKDIR /app
```

### `COPY` — Copying Files Into the Image

```dockerfile
COPY package*.json ./       # copy specific files
COPY . .                       # copy everything from the build context into the image
COPY --chown=node:node . .        # copy AND set ownership in one step
```

### `ADD` — Similar to COPY, With Extra Capabilities

```dockerfile
ADD archive.tar.gz /app/    # automatically extracts archives
ADD https://example.com/file.txt /app/   # can fetch remote URLs directly
```

**Best practice:** prefer `COPY` over `ADD` unless you specifically need `ADD`'s auto-extraction or remote-fetch behavior — `COPY`'s behavior is more predictable and explicit.

### `RUN` — Executing Commands During the Build

```dockerfile
RUN npm install
RUN apt-get update && apt-get install -y curl
```

Each `RUN` instruction creates a new layer — combining related commands into a single `RUN` (using `&&`) reduces the number of layers and avoids leaving intermediate artifacts (like package manager caches) in earlier layers.

### `ENV` — Setting Environment Variables

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
```

These become available both during the build (to subsequent instructions) and at runtime inside the container.

### `EXPOSE` — Documenting Which Ports the Container Uses

```dockerfile
EXPOSE 3000
```

> **Important nuance:** `EXPOSE` is purely **documentation** — it doesn't actually publish the port to the host. You still need `-p` on `docker run` (or `ports:` in Docker Compose) to actually map the port. `EXPOSE` mainly helps tooling and readers understand what the container listens on.

### `CMD` — The Default Command

Specifies what runs when a container starts, unless overridden at `docker run` time.

```dockerfile
CMD ["node", "server.js"]   # "exec form" — preferred, runs directly without a shell wrapper
CMD node server.js             # "shell form" — runs via /bin/sh -c, less predictable signal handling
```

A Dockerfile can only have one effective `CMD` — if multiple are specified, only the last one takes effect.

```bash
docker run myapp:1.0                       # runs the Dockerfile's CMD
docker run myapp:1.0 npm test                 # OVERRIDES CMD entirely, runs "npm test" instead
```

### `ENTRYPOINT` — A Command That's Harder to Override

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]
```

```bash
docker run myapp:1.0              # runs: node server.js
docker run myapp:1.0 other.js        # runs: node other.js  (CMD is overridden, but ENTRYPOINT is NOT)
```

`ENTRYPOINT` and `CMD` are commonly combined this way — `ENTRYPOINT` defines the fixed program to run, `CMD` provides default arguments that can be easily overridden at `docker run` time.

### `ARG` — Build-Time Variables

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine
```

```bash
docker build --build-arg NODE_VERSION=18 -t myapp:1.0 .
```

Unlike `ENV`, `ARG` values are **only** available during the build — they're not present in the running container unless explicitly also set via `ENV`.

### `USER` — Running as a Non-Root User (Security Best Practice)

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

By default, containers run as `root` unless told otherwise — a significant security risk if an attacker manages to escape the application into the container's OS layer. Running as a dedicated non-root user is a widely recommended security hardening practice.

### `VOLUME` — Declaring a Mount Point

```dockerfile
VOLUME /app/data
```

Signals that this directory should be treated as persistent/externally-managed storage (full detail in the Volumes notes).

## `.dockerignore` — Excluding Files From the Build Context

Just like `.gitignore`, prevents unnecessary (or sensitive) files from being sent to the Docker build context, speeding up builds and avoiding accidentally baking secrets/bloat into an image.

```
node_modules/
.git/
.env
*.log
Dockerfile
.dockerignore
```

```dockerfile
COPY . .   # without .dockerignore, this could accidentally copy node_modules/, .env, etc. into the image
```

## Layer Caching — Ordering Instructions for Optimal Build Speed

Docker caches each layer; if a layer's inputs haven't changed, it reuses the cache instead of re-executing. **Order instructions from least-frequently-changing to most-frequently-changing** to maximize cache reuse.

```dockerfile
# GOOD — dependencies installed BEFORE copying application code
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./     # only invalidates the cache when package.json actually changes
RUN npm install              # this expensive step is CACHED and SKIPPED on rebuilds
                               # where only application code changed, not dependencies
COPY . .                        # application code copied LAST, since it changes most often
CMD ["node", "server.js"]
```

```dockerfile
# BAD — any code change invalidates npm install's cache too, forcing a full reinstall every time
FROM node:20-alpine
WORKDIR /app
COPY . .              # copying EVERYTHING first means ANY file change invalidates this layer
RUN npm install          # ...and therefore this layer must ALSO re-run on every single code change
CMD ["node", "server.js"]
```

This ordering optimization is one of the single most impactful Dockerfile best practices for build speed in iterative development.

## Complete, Production-Minded Example

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencies first, for cache efficiency
COPY package*.json ./
RUN npm ci --only=production

# Application code
COPY . .

# Security — don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

## Common Interview-Style Questions

- **What's the difference between `CMD` and `ENTRYPOINT`?**
  `CMD` provides a default command that's entirely overridden if arguments are passed to `docker run`; `ENTRYPOINT` defines a fixed program that's harder to override, with any arguments passed to `docker run` appended to it (or overriding `CMD` specifically when the two are combined, since `CMD` supplies default arguments to `ENTRYPOINT`).

- **Why does instruction ordering in a Dockerfile matter for build performance?**
  Docker caches each layer, reusing it if its inputs haven't changed; ordering instructions from least-to-most frequently changing (e.g., copying `package.json` and running `npm install` before copying the rest of the application code) maximizes cache hits, since a code-only change won't invalidate the expensive dependency-installation layer.

- **What's the difference between `ARG` and `ENV`?**
  `ARG` defines a build-time-only variable, available during the image build but not present in the running container unless separately set via `ENV`; `ENV` sets an environment variable available both during the build and persistently at runtime inside the container.

- **Does `EXPOSE` actually make a container's port accessible from the host?**
  No — `EXPOSE` is purely documentation/metadata about which port the container listens on; actually publishing that port to the host requires the `-p` flag on `docker run` (or the `ports:` section in Docker Compose).

- **Why is it considered a security best practice to add a `USER` instruction rather than running as the default root user?**
  Containers run as root by default unless explicitly configured otherwise; running as root increases the potential damage if an attacker manages to escape the containerized application into the underlying container OS layer, so switching to a dedicated non-root user is a widely recommended hardening measure.
