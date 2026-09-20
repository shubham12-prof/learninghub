# 08. Interview Questions — Docker (Comprehensive)

A consolidated set of commonly asked Docker interview questions, organized by topic, with concise answers and code where useful.

---

## Images

**Q: Image vs container?**
An image is a read-only, immutable template; a container is a running (or stopped) instance created from that image.

**Q: How does layered image structure help build performance?**
Each Dockerfile instruction creates a cached layer; unchanged earlier layers are reused on rebuilds, dramatically speeding up iterative builds when only later layers change.

**Q: Why avoid `:latest` in production?**
It's a mutable reference that can point to different image content over time, making builds non-reproducible; pin specific versions or digests instead.

**Q: Tag vs digest?**
A tag is mutable and can be reassigned; a digest is an immutable cryptographic hash guaranteeing the exact same image content every time.

---

## Containers

**Q: Container vs VM?**
A container shares the host kernel and isolates only the process/filesystem/network namespace (lightweight, fast startup); a VM virtualizes an entire guest OS via a hypervisor (heavier, slower boot).

**Q: What happens to data in a container's filesystem when it's removed?**
Lost by default — containers are ephemeral; persistent data requires an explicitly mounted volume.

**Q: `docker stop` vs `docker kill`?**
`stop` sends SIGTERM and waits for a graceful shutdown timeout before force-killing; `kill` immediately force-terminates with SIGKILL.

**Q: Why is a health check needed beyond just process liveness?**
A container's main process can remain "running" while the application inside is actually broken or unresponsive; a health check explicitly verifies functional correctness.

---

## Dockerfile

**Q: `CMD` vs `ENTRYPOINT`?**
`CMD` provides a default command fully overridden by `docker run` arguments; `ENTRYPOINT` defines a fixed program harder to override, often combined with `CMD` supplying default arguments to it.

**Q: Why does instruction ordering matter for build speed?**
Docker caches layers; ordering from least-to-most frequently changing (dependencies before application code) maximizes cache reuse, avoiding unnecessary reinstalls on code-only changes.

**Q: `ARG` vs `ENV`?**
`ARG` is build-time only, not present in the running container unless also set via `ENV`; `ENV` persists both during build and at runtime.

**Q: Does `EXPOSE` publish a port to the host?**
No — it's documentation only; actual publishing requires `-p` on `docker run` or `ports:` in Compose.

---

## Docker Compose

**Q: What problem does Compose solve?**
Declaratively defining a multi-container application (services, networking, volumes, config) in one YAML file instead of many manual `docker run` commands.

**Q: How do Compose services reach each other?**
Via Docker's built-in DNS within the project's automatically-created network — each service is reachable by its service name as a hostname.

**Q: Limitation of `depends_on`?**
Controls only start order, not actual readiness; combine with `healthcheck` and `condition: service_healthy` for genuine readiness waiting.

**Q: Why use an anonymous volume like `/app/node_modules` alongside a bind mount?**
Prevents the host's bind-mounted directory (lacking or mismatching node_modules) from overwriting the container's own installed dependencies.

---

## Volumes

**Q: Named volume vs bind mount?**
Named volumes are Docker-managed and portable, best for persistent application data; bind mounts directly map a specific host path, best for local development with live code editing.

**Q: Why is running a database without a volume dangerous?**
Data lives only in the container's ephemeral filesystem, permanently lost on any container removal/recreation — a volume ensures persistence independent of the container lifecycle.

**Q: What is a `tmpfs` mount?**
A memory-backed mount, never written to disk, lost when the container stops — used for temporary, sensitive, or performance-critical data.

---

## Networks

**Q: Why can't default bridge containers reach each other by name?**
Docker's DNS-based service discovery only works on custom user-defined bridge networks, not the default bridge network (a legacy limitation).

**Q: How does Compose handle networking automatically?**
Creates a project-specific custom bridge network and connects all services to it, enabling name-based DNS resolution with zero manual configuration.

**Q: How do you isolate a database from a public-facing service within one Compose file?**
Define separate networks and only attach the database to the internal one; services not sharing a network can't reach each other directly.

**Q: Trade-off of the `host` network driver?**
Eliminates the need for port mapping and improves performance slightly, but sacrifices network isolation and isn't available on Docker Desktop for Mac/Windows.

---

## Multi-stage Builds

**Q: What problem do multi-stage builds solve?**
Build tools/dev dependencies used during compilation would otherwise bloat the final image; multi-stage builds let you copy only necessary artifacts into a minimal final stage.

**Q: How do you copy files between stages?**
`COPY --from=<stage-name>`, referencing a stage defined with `AS <name>` earlier in the Dockerfile (or even an external image).

**Q: Why use `FROM scratch`?**
For statically-compiled binaries with zero runtime dependencies, producing the smallest possible final image.

**Q: How can multi-stage builds integrate testing?**
A dedicated test stage running the test suite fails the entire build if tests fail, acting as a built-in quality gate before the production stage is even built.

---

## Practical / Coding Questions Often Asked Live

**Q: Write an optimized Dockerfile for a Node.js app that maximizes cache reuse.**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

**Q: Write a multi-stage Dockerfile for a TypeScript app.**

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

**Q: Write a docker-compose.yml for a Node.js app with Postgres, waiting for DB readiness.**

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

volumes:
  db_data:
```

**Q: How would you diagnose why a Docker image is much larger than expected?**
Run `docker history <image>` to see each layer's size contribution and the command that created it, identifying which instruction is responsible for the bloat (e.g., an uncached package manager step, or copying unnecessary files due to a missing `.dockerignore`); then address it via multi-stage builds, a smaller base image, or combining/cleaning up RUN instructions within the same layer.

**Q: Design a full containerized development setup for a Node.js + Postgres + Redis application, including live code reload.**
A `docker-compose.yml` with three services: `web` (built from a dev-targeted Dockerfile stage, bind-mounting the project directory plus an anonymous volume for `node_modules` to enable live reload), `db` (Postgres image with a named volume for persistence and a health check), and `cache` (Redis image); `web` depends on `db` with `condition: service_healthy`; all services communicate via Compose's automatic service-name DNS resolution, with only `web`'s port published to the host.
