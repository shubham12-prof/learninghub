# 01. Images

## What is a Docker Image?

A Docker image is a read-only, immutable template containing everything needed to run an application — application code, a runtime (like Node.js), system libraries, environment variables, and configuration. Containers (covered in the next notes) are simply **running instances** of an image.

```
Image:      the blueprint / class definition   (immutable, static)
Container:  a running instance of that image     (mutable, has its own state while running)
```

## Images Are Built from Layers

A Docker image is composed of a stack of read-only **layers**, each representing a filesystem change (adding files, running a command, setting an environment variable) — this layered structure is central to how Docker builds, caches, and shares images efficiently.

```
Layer 4: COPY . .                (your application code)
Layer 3: RUN npm install           (installed dependencies)
Layer 2: WORKDIR /app                (working directory set)
Layer 1: FROM node:20-alpine           (base OS + Node.js runtime)
```

Each instruction in a Dockerfile (covered in its own notes) typically creates a new layer. Layers are cached — if an earlier layer hasn't changed, Docker reuses it instead of rebuilding it, dramatically speeding up repeated builds.

## Pulling and Listing Images

```bash
docker pull node:20-alpine        # download an image from a registry (Docker Hub by default)
docker images                       # list all images stored locally
docker image ls                      # same as above, more explicit syntax
docker rmi node:20-alpine              # remove a local image
docker image prune                       # remove unused/dangling images to reclaim disk space
```

## Image Naming and Tags

```
node:20-alpine
 │      │
 │      └─ tag — a specific version/variant
 └──────── repository name (image name)

Full form: [registry/]repository[:tag]
Example:   docker.io/library/node:20-alpine
           myregistry.com/myteam/myapp:v2.1.0
```

```bash
docker pull node                # implicitly pulls the "latest" tag if none specified
docker pull node:latest           # equivalent to the above
docker pull node:20                 # a specific major version
docker pull node:20-alpine            # a specific version + a lightweight base OS variant
```

> **Best practice:** avoid relying on `:latest` in production — it's not guaranteed to be stable or even consistent over time (whatever the maintainer most recently tagged as "latest"). Pin specific versions for reproducible builds.

## Common Base Image Variants

| Variant            | Description                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node:20`          | Full Debian-based image — larger, but includes more tools/libraries out of the box                                                                                                 |
| `node:20-slim`     | Reduced Debian-based image — smaller, fewer pre-installed extras                                                                                                                   |
| `node:20-alpine`   | Based on Alpine Linux — much smaller (~5x+ reduction), but uses `musl` libc instead of `glibc`, which can occasionally cause compatibility issues with certain native dependencies |
| `node:20-bullseye` | Explicitly pinned to a specific Debian release codename, for maximum reproducibility                                                                                               |

**Trade-off:** Alpine-based images are popular for their small size (faster pulls, smaller attack surface, less disk usage), but can occasionally hit subtle compatibility issues with native Node modules compiled against `glibc` — worth testing thoroughly if switching base images.

## Building an Image

```bash
docker build -t myapp:1.0 .          # build from the Dockerfile in the current directory, tag it "myapp:1.0"
docker build -t myapp:1.0 -f Dockerfile.prod .   # use a specific, non-default Dockerfile
```

(Full detail on writing Dockerfiles in the dedicated Dockerfile notes.)

## Inspecting an Image

```bash
docker inspect myapp:1.0        # detailed JSON metadata (layers, env vars, exposed ports, entrypoint, etc.)
docker history myapp:1.0          # see each layer and the command that created it, plus its size contribution
```

```bash
docker history node:20-alpine
# IMAGE          CREATED BY                       SIZE
# a1b2c3d4        CMD ["node"]                       0B
# e5f6g7h8         ENV NODE_VERSION=20.11.0            0B
# ...
```

This is a genuinely useful debugging tool for understanding why an image is larger than expected — you can see exactly which layer/instruction contributed the most size.

## Image Registries — Where Images Live

```
Docker Hub          -> the default public registry (docker.io)
GitHub Container Registry (ghcr.io)  -> integrated with GitHub, common for open-source projects
AWS ECR, GCP Artifact Registry, Azure ACR -> cloud-provider-specific private registries
Self-hosted registry -> running your own (e.g., via the official `registry` image) for full control
```

```bash
docker login ghcr.io                              # authenticate with a registry
docker tag myapp:1.0 ghcr.io/username/myapp:1.0      # re-tag for a specific registry
docker push ghcr.io/username/myapp:1.0                 # upload the image
```

## Image Digests — Immutable, Content-Addressed References

Unlike tags (which can be reassigned to point at a different image later), a digest is a cryptographic hash of the image's exact content — pulling by digest guarantees you get exactly that image, byte-for-byte, forever.

```bash
docker pull node@sha256:a1b2c3d4e5f6...   # pull by digest — fully immutable, unlike a tag
```

```
Tag:     node:20-alpine  -> can be RE-TAGGED to point at a different image later (mutable reference)
Digest:  node@sha256:...  -> always refers to the EXACT same image content (immutable reference)
```

Highly security-conscious or reproducibility-focused pipelines often pin dependencies by digest rather than tag for this reason.

## Reducing Image Size — Why It Matters

```
Smaller images ->
  Faster builds and pulls (less data to transfer)
  Faster container startup
  Smaller attack surface (fewer packages/tools = fewer potential vulnerabilities)
  Lower storage/bandwidth costs at scale
```

Techniques: using a minimal base image (Alpine/slim variants), multi-stage builds (covered in its own dedicated notes), cleaning up build artifacts/caches within the same layer they were created, and avoiding unnecessary installed packages.

```dockerfile
# BAD — leaves apt cache in the image, bloating its size
RUN apt-get update && apt-get install -y curl

# GOOD — cleans up in the SAME layer/instruction, so the cache never persists in any layer
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

## Scanning Images for Vulnerabilities

```bash
docker scout cves myapp:1.0    # Docker's built-in vulnerability scanning (via Docker Scout)
```

Third-party tools (Trivy, Snyk, Grype) are also widely used, often integrated directly into CI/CD pipelines to block deployment of images with known critical vulnerabilities.

## Common Interview-Style Questions

- **What's the difference between a Docker image and a Docker container?**
  An image is a read-only, immutable template/blueprint containing everything needed to run an application; a container is a running (or stopped) instance created from that image, with its own writable state while it exists.

- **How does Docker's layered image structure improve build performance?**
  Each instruction in a Dockerfile typically creates a cached layer; if an earlier layer's inputs haven't changed on a rebuild, Docker reuses the cached layer instead of re-executing that instruction, dramatically speeding up repeated builds when only later layers (like application code) have actually changed.

- **Why is relying on the `:latest` tag discouraged in production?**
  It's a mutable reference that can point to a different image over time as new versions are published under that tag, making builds non-reproducible and potentially introducing unexpected changes; pinning a specific version tag (or digest) ensures consistency.

- **What's the difference between referencing an image by tag versus by digest?**
  A tag is a mutable, human-readable label that can be reassigned to point at different image content over time; a digest is an immutable, cryptographic hash of the exact image content, guaranteeing you always get precisely that image regardless of what any tag might later point to.

- **Why are Alpine-based images popular, and what's a potential trade-off of using them?**
  They're significantly smaller than full Debian-based images, reducing pull time, storage, and attack surface; the trade-off is Alpine uses `musl` libc instead of `glibc`, which can occasionally cause subtle compatibility issues with certain native dependencies compiled against `glibc`.
