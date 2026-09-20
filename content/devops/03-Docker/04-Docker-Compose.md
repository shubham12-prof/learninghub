# 04. Docker Compose

## What is Docker Compose?

Docker Compose is a tool for defining and running **multi-container** applications using a single declarative YAML file, rather than manually running many `docker run` commands with matching flags. It's the standard way to orchestrate local development environments involving multiple services (an app server, a database, a cache, etc.).

```bash
docker compose up      # start ALL services defined in docker-compose.yml
docker compose down       # stop and remove all services, networks (and optionally volumes)
```

## A Basic `docker-compose.yml`

```yaml
version: "3.9"

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  db_data:
```

## Key Sections Explained

### `services` — The Containers That Make Up Your App

Each entry under `services` defines one container (an image to run, or a Dockerfile to build).

```yaml
services:
  web:
    build: . # build from a local Dockerfile
  redis:
    image: redis:7-alpine # or use a pre-built image directly, no build needed
```

### `build` vs `image`

```yaml
web:
  build:
    context: . # directory containing the Dockerfile and build context
    dockerfile: Dockerfile.dev # optional — specify a non-default Dockerfile name
```

```yaml
db:
  image: postgres:16 # pull directly from a registry, no local build
```

### `ports` — Publishing Container Ports to the Host

```yaml
ports:
  - "3000:3000" # host:container
  - "8080:80" # host port 8080 maps to container's port 80
```

### `environment` — Setting Environment Variables

```yaml
environment:
  - NODE_ENV=development
  - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
```

```yaml
env_file:
  - .env # load environment variables from a file instead of listing them inline
```

### `depends_on` — Controlling Startup Order

```yaml
web:
  depends_on:
    - db
```

> **Important nuance:** `depends_on` by default only controls **start order** (start `db` before `web`), not actual readiness — `db`'s container process might have started but the database inside it might not yet be ready to accept connections. For genuine readiness waiting, combine with a health check.

```yaml
db:
  image: postgres:16
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 3s
    retries: 5

web:
  depends_on:
    db:
      condition: service_healthy # wait for db to be genuinely HEALTHY, not just started
```

### `volumes` — Persisting Data and Enabling Live Code Reload

```yaml
volumes:
  - .:/app # bind mount — the host's current directory maps into the container,
    # so local code edits are immediately reflected inside the running container
  - /app/node_modules # an "anonymous volume" trick — prevents the host's bind mount above
    # from OVERWRITING the container's own installed node_modules
  - db_data:/var/lib/postgresql/data # a NAMED volume — Docker-managed persistent storage
```

(Full detail on volume types in the dedicated Volumes notes.)

### `networks` — Custom Network Configuration

By default, Compose creates a single network shared by all services in the file, letting them reach each other by service name (e.g., `web` can reach the database at hostname `db`). Custom network configuration is possible for more advanced isolation needs.

```yaml
networks:
  frontend:
  backend:

services:
  web:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend # db is ONLY reachable from services also on the "backend" network, not "frontend"
```

(Full detail in the dedicated Networks notes.)

## Service Discovery Within Compose — Using Service Names as Hostnames

This is one of Compose's most useful features: services can reach each other using their **service name** as a DNS hostname, without needing to know actual IP addresses.

```yaml
services:
  web:
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
        # ^^ "db" resolves automatically to the db service's container
  db:
    image: postgres:16
```

```js
// Inside the "web" container's application code:
const client = new Client({ connectionString: process.env.DATABASE_URL });
// "db" in that connection string resolves correctly via Compose's internal DNS
```

## Common Compose Commands

```bash
docker compose up                 # start all services (foreground, logs streamed to terminal)
docker compose up -d                 # start in detached (background) mode
docker compose up --build              # force a rebuild of images before starting
docker compose down                       # stop and remove containers + the default network
docker compose down -v                     # ALSO remove named volumes (careful — deletes persistent data!)

docker compose ps                             # list running services
docker compose logs                             # view logs from all services
docker compose logs -f web                        # follow logs from a specific service

docker compose exec web sh                          # open a shell inside a running service's container
docker compose run web npm test                       # run a ONE-OFF command in a new container (not the running one)

docker compose stop                                      # stop services WITHOUT removing containers
docker compose restart web                                  # restart a specific service
```

## Multiple Compose Files — Environment-Specific Overrides

Compose supports layering multiple files, letting you share a base configuration while overriding specific settings per environment.

```yaml
# docker-compose.yml (base configuration, shared across all environments)
services:
  web:
    build: .
    ports:
      - "3000:3000"
```

```yaml
# docker-compose.override.yml (automatically applied on top in local development)
services:
  web:
    volumes:
      - .:/app # live code reload, only wanted locally
    environment:
      - NODE_ENV=development
```

```yaml
# docker-compose.prod.yml (explicitly specified for production)
services:
  web:
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
docker compose up                                    # uses docker-compose.yml + docker-compose.override.yml automatically
docker compose -f docker-compose.yml -f docker-compose.prod.yml up   # explicitly layer base + prod config
```

## Scaling Services

```bash
docker compose up --scale web=3   # run 3 instances of the "web" service simultaneously
```

Useful for local testing of load-balanced/horizontally-scaled behavior, though production-grade orchestration at real scale typically moves to Kubernetes or a similar dedicated orchestrator rather than relying on Compose scaling directly.

## Docker Compose for Local Development — A Complete Practical Example

```yaml
version: "3.9"

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db_data:
```

This single file spins up a complete local development environment — app, database, and cache — all correctly networked and able to reach each other by service name, with a single `docker compose up`.

## Common Interview-Style Questions

- **What problem does Docker Compose solve compared to running individual `docker run` commands?**
  It lets you declaratively define an entire multi-container application (services, networking, volumes, environment configuration) in a single YAML file, replacing the need to manually run and coordinate many separate `docker run` commands with matching flags — and makes the whole setup reproducible and version-controllable.

- **How do services within a Compose file reach each other over the network?**
  Via Docker's built-in DNS resolution within the default (or a custom) Compose network — each service can be reached by other services using its service name as a hostname, without needing to know or hardcode actual container IP addresses.

- **What's an important limitation of `depends_on` regarding startup order?**
  By default, it only controls the order in which containers are _started_, not whether the dependency is actually _ready_ to accept requests (e.g., a database container process starting doesn't mean the database itself is ready for connections yet); combining it with a `healthcheck` and `condition: service_healthy` addresses this by waiting for genuine readiness.

- **Why might a Compose file use an "anonymous volume" like `/app/node_modules` alongside a bind mount of the whole project directory?**
  Without it, the host's bind-mounted project directory (which typically doesn't include `node_modules`, or has a different OS-specific build of native dependencies) would overwrite the container's own installed `node_modules`; the anonymous volume preserves the container's internally-installed dependencies despite the broader directory being bind-mounted from the host.

- **How does layering multiple Compose files (base + override) support different environments?**
  A base `docker-compose.yml` defines shared configuration common to all environments; environment-specific files (like `docker-compose.override.yml`, applied automatically, or `docker-compose.prod.yml`, applied explicitly) layer additional or overriding settings on top — letting teams avoid duplicating the entire configuration for each environment while still customizing what differs.
