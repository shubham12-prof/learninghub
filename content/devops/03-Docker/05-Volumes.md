# 05. Volumes

## Why Volumes Are Necessary

Containers are ephemeral by design — any data written to a container's own filesystem is lost when that container is removed. Volumes provide a mechanism for **persistent storage** that exists independently of any single container's lifecycle, and for sharing data between the host and a container (or between multiple containers).

```
Container filesystem (without a volume):  data LOST when the container is removed
Volume-mounted directory:                   data PERSISTS independently, survives container removal
```

## Three Types of Mounts in Docker

### 1. Named Volumes — Docker-Managed Persistent Storage

The most common and generally recommended approach for persistent application data (like a database's data files).

```bash
docker volume create my-data
docker run -v my-data:/var/lib/postgresql/data postgres:16
```

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data: # declares a named volume, Docker manages its actual storage location on the host
```

Docker manages exactly where this data physically lives on the host filesystem (typically somewhere under `/var/lib/docker/volumes/` on Linux) — you interact with it purely through its name, not a raw filesystem path.

```bash
docker volume ls                # list all named volumes
docker volume inspect my-data      # see details, including its actual host filesystem location
docker volume rm my-data              # delete a named volume (and its data!)
docker volume prune                     # remove all volumes not currently used by any container
```

### 2. Bind Mounts — Directly Mapping a Host Path

Maps a specific directory (or file) from the host filesystem directly into the container — changes are reflected immediately on both sides, since it's literally the same underlying files.

```bash
docker run -v /host/path/app:/app myapp:1.0
docker run -v $(pwd):/app myapp:1.0   # mount the current directory
```

```yaml
services:
  web:
    volumes:
      - .:/app # bind mount — the host's project directory maps directly into the container
```

**Primary use case:** local development — editing code on your host machine and seeing changes reflected immediately inside the running container, without rebuilding the image for every change.

### 3. `tmpfs` Mounts — Temporary, In-Memory Storage (Linux Only)

Data exists only in the host's memory, never written to disk — extremely fast, but entirely lost when the container stops (even more ephemeral than the container's own filesystem).

```bash
docker run --tmpfs /app/cache myapp:1.0
```

**Use case:** temporary, sensitive, or performance-critical data that should never touch disk (e.g., certain caching scenarios, or avoiding writing secrets to disk at all).

## Named Volumes vs Bind Mounts — When to Use Which

|                                           | Named Volume                                                         | Bind Mount                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Managed by                                | Docker                                                               | You (references an exact host path)                                                    |
| Portability                               | Fully portable — works the same regardless of host filesystem layout | Tied to a specific host directory structure                                            |
| Best for                                  | Persistent application data (databases, uploaded files)              | Local development (live code editing), accessing specific host config files            |
| Performance (especially on macOS/Windows) | Generally better                                                     | Can be noticeably slower on non-Linux hosts, due to filesystem virtualization overhead |

**Practical guidance:** use named volumes for anything that needs to genuinely persist and be managed by Docker (database storage); use bind mounts specifically for development workflows where you want host-edited files immediately visible inside the container.

## Sharing Data Between Multiple Containers

A named volume can be mounted into multiple containers simultaneously, letting them share data.

```yaml
services:
  app1:
    volumes:
      - shared_data:/data
  app2:
    volumes:
      - shared_data:/data

volumes:
  shared_data:
```

Both `app1` and `app2` see the exact same underlying data — useful for patterns like a shared upload directory accessed by multiple services, though for most genuinely distributed/scaled scenarios, an external service (S3, a shared database) is usually a more robust choice than a shared local volume.

## Read-Only Mounts

```bash
docker run -v my-data:/app/config:ro myapp:1.0   # container can READ but not WRITE to this mount
```

```yaml
volumes:
  - ./config:/app/config:ro # useful for injecting configuration files the app should never modify
```

## Volume Drivers — Beyond Local Storage

Docker's volume system is pluggable — volume drivers let volumes be backed by network storage, cloud storage, or other systems rather than just the local host disk, important for multi-host/orchestrated environments (like Docker Swarm or Kubernetes) where a container might run on any of several different physical hosts.

```bash
docker volume create --driver=some-network-storage-driver my-data
```

## Backing Up and Restoring a Named Volume

Since Docker manages a named volume's actual storage location, a common pattern for backup/restore uses a temporary container to access and archive/extract its contents.

```bash
# Backup — archive the volume's contents to a tarball on the host
docker run --rm -v my-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/my-data-backup.tar.gz -C /data .

# Restore — extract a backup tarball back into the volume
docker run --rm -v my-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/my-data-backup.tar.gz -C /data
```

## Volumes and Database Containers — A Critical Practical Pattern

Running a database in a container **without** a properly configured volume is a common, serious mistake — every `docker rm` (or even certain `docker-compose down` scenarios) would otherwise destroy all the database's data.

```yaml
# CORRECT — data survives container recreation
services:
  db:
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

```yaml
# DANGEROUS — no volume, all data lost the moment this container is removed/recreated
services:
  db:
    image: postgres:16
    # (no volumes section — data lives only in the container's ephemeral filesystem)
```

## Common Interview-Style Questions

- **Why are volumes necessary given that containers already have a filesystem?**
  A container's own filesystem is ephemeral — any data written to it is lost when the container is removed; volumes provide storage that exists independently of any specific container's lifecycle, enabling genuine data persistence and sharing.

- **What's the difference between a named volume and a bind mount?**
  A named volume is fully managed by Docker (storage location, lifecycle) and is portable across different host environments, generally used for persistent application data; a bind mount directly maps a specific host filesystem path into the container, primarily used in local development for live code editing, but tied to that specific host's directory structure.

- **Why is running a database in a container without a properly configured volume dangerous?**
  Without a volume, the database's data lives only in the container's own ephemeral filesystem, meaning any container removal or recreation (routine during updates/redeployments) would permanently destroy all stored data — a named volume ensures the actual data persists independently of the container's lifecycle.

- **What is a `tmpfs` mount, and when would you use one?**
  A mount backed entirely by host memory rather than disk, meaning data is never written to persistent storage and is lost when the container stops; used for temporary, sensitive, or performance-critical data that specifically shouldn't touch disk at all.

- **How would you back up the data in a Docker-managed named volume?**
  Run a temporary container that mounts both the named volume and a host directory, then use a tool like `tar` inside that container to archive the volume's contents to the host-mounted directory (or restore from an existing archive back into the volume) — since the volume's actual storage location is managed by Docker rather than a directly accessible host path.
