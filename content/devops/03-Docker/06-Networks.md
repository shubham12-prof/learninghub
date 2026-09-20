# 06. Networks

## Why Docker Networking Matters

By default, containers are isolated from each other and the host — Docker's networking system controls how containers communicate with each other, with the host machine, and with the outside world. Understanding this is essential for building any multi-container application.

## Docker's Built-in Network Drivers

| Driver    | Description                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `bridge`  | Default — an isolated private network on the host, containers can communicate with each other and reach the outside world (via NAT) |
| `host`    | Container shares the host's network stack directly — no isolation, no port mapping needed, but less secure/portable                 |
| `none`    | No networking at all — fully isolated container                                                                                     |
| `overlay` | Spans multiple Docker hosts — used for Docker Swarm/multi-host clustering                                                           |
| `macvlan` | Assigns a container its own MAC address, making it appear as a physical device on the network                                       |

## The Default Bridge Network

```bash
docker network ls
# NETWORK ID     NAME      DRIVER    SCOPE
# a1b2c3d4        bridge     bridge    local
# e5f6g7h8         host        host      local
# i9j0k1l2          none         null      local
```

```bash
docker run -d --name web nginx   # without specifying a network, joins the default "bridge" network
```

> **Important limitation:** containers on the **default** bridge network can only reach each other by IP address, not by container name — Docker's automatic DNS-based service discovery (containers reaching each other by name) only works on **custom** user-defined bridge networks, not the default one. This is a common source of confusion.

## Creating a Custom Bridge Network

```bash
docker network create my-network
docker run -d --name web --network my-network nginx
docker run -d --name db --network my-network postgres:16
```

On a custom network, `web` can reach `db` simply by using `db` as a hostname — Docker's embedded DNS server resolves container names automatically.

```bash
docker exec web ping db   # works on a custom network — resolves "db" to the correct container IP
```

```bash
docker network inspect my-network   # see connected containers, subnet, gateway, etc.
```

## Networking in Docker Compose — Automatic and Simplified

As covered in the Docker Compose notes, Compose automatically creates a custom bridge network for each project, and every service can reach every other service by its service name — you get this DNS-based discovery for free, without manually creating a network.

```yaml
services:
  web:
    build: .
  db:
    image: postgres:16
```

```
web can reach db at hostname "db" automatically — no manual network setup needed,
because Compose creates a project-specific custom network by default
```

## Multiple Networks — Isolating Services from Each Other

```yaml
networks:
  frontend:
  backend:

services:
  web:
    networks:
      - frontend
      - backend
  api:
    networks:
      - backend
  db:
    networks:
      - backend # db is ONLY reachable from services also on "backend" — NOT from "frontend"
```

```
frontend network:  web
backend network:    web, api, db

-> a hypothetical "public-facing" container on ONLY the frontend network could never
   directly reach "db", since they don't share a common network — a useful security boundary
```

This pattern is a practical way to enforce network-level segmentation between publicly-facing and internal-only services, even within a single Compose file on a single host.

## Port Publishing — Connecting a Container's Network to the Host

```bash
docker run -p 3000:3000 myapp:1.0
#           │    │
#      host port  container port
```

```bash
docker run -p 127.0.0.1:3000:3000 myapp:1.0   # bind ONLY to localhost, not all host network interfaces
docker run -p 3000:3000/udp myapp:1.0           # specify UDP instead of the default TCP
```

Without explicit port publishing, a container's ports are reachable from other containers on the same Docker network, but **not** from the host machine or the outside world — publishing is what bridges the container's isolated network to the host's.

## The `host` Network Driver — Bypassing Isolation

```bash
docker run --network host nginx
```

The container shares the host's network namespace entirely — no port mapping needed (the container's ports ARE the host's ports directly), but this sacrifices the network isolation that's normally one of containers' key benefits, and isn't available at all on Docker Desktop for Mac/Windows (only native Linux hosts).

## Container-to-Container Communication Patterns

### Same Custom Network (Most Common)

```bash
docker network create app-net
docker run -d --name api --network app-net myapi:1.0
docker run -d --name db --network app-net postgres:16
```

```js
// Inside the "api" container
const connectionString = "postgresql://user:pass@db:5432/mydb"; // "db" resolves via Docker's DNS
```

### Linking Containers Across Different Compose Projects

By default, each `docker compose` project gets its own isolated network — containers in one project can't reach containers in a different project's network unless you explicitly connect them.

```bash
docker network create shared-net
```

```yaml
# project-a/docker-compose.yml
networks:
  default:
    name: shared-net
    external: true
```

```yaml
# project-b/docker-compose.yml
networks:
  default:
    name: shared-net
    external: true
```

Both projects now share the same external network, letting their services reach each other by container/service name.

## Inspecting Network Connectivity

```bash
docker network inspect bridge          # see all containers connected to a specific network
docker exec my-container ip addr           # view network interfaces INSIDE a container
docker exec my-container cat /etc/hosts      # see the container's DNS resolution entries
```

## DNS Resolution Inside Docker Networks

Docker runs an embedded DNS server (at `127.0.0.11` inside each container on a custom network) that automatically resolves container/service names to their current IP addresses — critical because container IPs can change (e.g., after a restart), but the name-based resolution remains stable and correct.

```bash
docker exec web cat /etc/resolv.conf
# nameserver 127.0.0.11   <- Docker's embedded DNS resolver
```

## Common Interview-Style Questions

- **Why can't containers on the default bridge network reach each other by name, while containers on a custom bridge network can?**
  Docker's automatic DNS-based service discovery (resolving container names to IPs) is only enabled on custom, user-defined bridge networks — the default bridge network predates this feature and only supports reaching other containers by their IP address, a legacy limitation that's a common source of confusion.

- **How does Docker Compose handle networking between services without any manual configuration?**
  Compose automatically creates a project-specific custom bridge network and connects all defined services to it, giving each service the ability to reach any other service by its service name via Docker's embedded DNS — no manual `docker network create` or explicit configuration required.

- **How would you prevent a database container from being directly reachable by a public-facing frontend container, within the same Compose file?**
  Define separate networks (e.g., `frontend` and `backend`) and only attach the database to `backend`, while the public-facing service is attached to `frontend` (and `backend` if it genuinely needs to reach the database indirectly through an API layer) — containers not sharing a common network can't reach each other directly.

- **What does publishing a port (`-p host:container`) actually do, and why is it necessary?**
  It bridges a container's isolated internal network to the host machine, mapping a specific host port to a specific container port; without it, a container's ports remain reachable only from other containers on the same Docker network, not from the host machine or the outside world.

- **What's the trade-off of using the `host` network driver instead of the default bridge network?**
  The container shares the host's network namespace directly, eliminating the need for port mapping (since the container's ports are literally the host's ports) and offering slightly better network performance, but sacrificing the network isolation that's normally a key security/portability benefit of containerization — and it's unavailable on Docker Desktop for Mac/Windows, only native Linux hosts.
