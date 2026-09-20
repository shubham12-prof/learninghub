# 02. Containers

## What is a Container?

A container is a running instance of an image — an isolated, lightweight process (or group of processes) with its own filesystem, network interface, and process space, but sharing the host machine's kernel (unlike a full virtual machine, which virtualizes an entire OS).

```
Virtual Machine:  Hardware -> Hypervisor -> Full Guest OS (per VM) -> App
                  (heavy — each VM includes a complete operating system)

Container:         Hardware -> Host OS -> Docker Engine -> Container (shares host kernel) -> App
                    (lightweight — containers share the host's kernel, isolating only what's needed)
```

This is why containers start in milliseconds/seconds (no OS boot required) and use dramatically less resource overhead than a comparable VM.

## Running a Container

```bash
docker run node:20-alpine                    # run a container, execute the image's default command, then exit
docker run -it node:20-alpine sh                # interactive mode with a shell (-i keeps STDIN open, -t allocates a pseudo-TTY)
docker run -d nginx                               # detached mode — runs in the background, returns immediately
docker run --name my-app -d myapp:1.0               # give the container a specific, memorable name
```

## Container Lifecycle

```
docker create -> docker start -> (running) -> docker stop -> (stopped) -> docker rm
     │                                              │
     └── docker run = create + start in one step ──┘
```

```bash
docker ps                  # list RUNNING containers
docker ps -a                 # list ALL containers, including stopped ones
docker start <container>       # start a stopped container
docker stop <container>          # gracefully stop a running container (sends SIGTERM, then SIGKILL after a timeout)
docker kill <container>            # immediately force-stop (sends SIGKILL directly)
docker restart <container>           # stop then start
docker rm <container>                  # remove a stopped container
docker rm -f <container>                 # force-remove a running container (stops it first)
```

## Port Mapping — Exposing Container Ports to the Host

By default, a container's network is isolated from the host — port mapping explicitly connects a host port to a container port.

```bash
docker run -p 3000:3000 myapp:1.0
#           │    │
#      host port  container port
```

```bash
docker run -p 8080:3000 myapp:1.0   # host's port 8080 -> container's internal port 3000
docker run -P myapp:1.0                # automatically map ALL exposed ports to random available host ports
```

## Environment Variables

```bash
docker run -e NODE_ENV=production -e PORT=3000 myapp:1.0

docker run --env-file .env myapp:1.0   # load environment variables from a file
```

## Viewing Logs

```bash
docker logs my-app           # view a container's stdout/stderr output
docker logs -f my-app          # follow logs in real time (like `tail -f`)
docker logs --tail 100 my-app     # only the last 100 lines
```

## Executing Commands Inside a Running Container

```bash
docker exec -it my-app sh        # open an interactive shell INSIDE a running container
docker exec my-app npm test         # run a one-off command inside a running container, without a persistent shell
```

Extremely useful for debugging — inspecting files, checking environment variables, or running diagnostic commands inside a live container without stopping it.

## Resource Limits

Containers share the host's kernel, but Docker can constrain how much CPU/memory an individual container is allowed to consume, preventing one misbehaving container from starving others.

```bash
docker run --memory="512m" --cpus="1.5" myapp:1.0
```

```
--memory="512m"   -> hard limit; container is killed (OOM) if it exceeds this
--cpus="1.5"        -> limits the container to at most 1.5 CPU cores' worth of processing time
```

## Inspecting Container Details

```bash
docker inspect my-app          # full JSON metadata: network settings, mounted volumes, env vars, resource limits, etc.
docker stats                     # live resource usage (CPU, memory, network I/O) across running containers
docker top my-app                  # list processes running INSIDE a specific container
```

## Copying Files Between Host and Container

```bash
docker cp my-app:/app/logs/error.log ./error.log   # copy FROM a container to the host
docker cp ./config.json my-app:/app/config.json       # copy FROM the host INTO a container
```

## Container Restart Policies

Control what happens automatically if a container crashes or the Docker daemon restarts (e.g., after a host reboot).

```bash
docker run --restart=no myapp:1.0                # default — never automatically restart
docker run --restart=on-failure myapp:1.0           # restart only if it exits with a non-zero (error) status
docker run --restart=always myapp:1.0                 # always restart, regardless of exit status
docker run --restart=unless-stopped myapp:1.0           # always restart UNLESS it was explicitly stopped by a user
```

`unless-stopped` is a very common production choice — the container survives crashes and host reboots automatically, but a deliberate `docker stop` is respected rather than immediately restarted.

## Container Health Checks

```dockerfile
# Defined in the Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```bash
docker ps   # shows health status (healthy/unhealthy/starting) alongside running containers
```

Health checks let Docker (and orchestrators built on top of it, like Kubernetes or Docker Swarm) know whether a container is actually functioning correctly, not just whether its main process is still running — a crashed database connection inside an otherwise "running" container wouldn't be caught without an explicit health check.

## Cleaning Up

```bash
docker container prune     # remove ALL stopped containers
docker system prune          # remove unused containers, networks, dangling images, and build cache
docker system prune -a         # more aggressive — also removes all unused images, not just dangling ones
```

## Ephemeral Nature of Containers — A Core Mental Model

By default, any data written inside a container's filesystem is **lost** when the container is removed — containers are meant to be treated as disposable, stateless compute units. Persistent data requires an explicit Volume (covered in its own dedicated notes) mounted into the container.

```
Container filesystem changes -> LOST when the container is removed (docker rm)
Volume-mounted data            -> PERSISTS independently of the container's lifecycle
```

This "cattle, not pets" mental model — containers should be easily destroyable and recreatable without data loss concerns, with actual persistent state living in volumes or external services — is foundational to how containerized applications should be architected.

## Common Interview-Style Questions

- **What's the fundamental difference between a container and a virtual machine?**
  A container shares the host machine's kernel and isolates only the application's process/filesystem/network namespace, making it lightweight and fast to start; a VM virtualizes an entire guest operating system on top of a hypervisor, which is significantly heavier and slower to boot.

- **What happens to data written inside a container's filesystem when the container is removed?**
  It's lost by default — containers are designed to be ephemeral/disposable; any data that needs to persist beyond a container's lifecycle must be stored in an explicitly mounted Volume or an external service.

- **What's the difference between `docker stop` and `docker kill`?**
  `docker stop` sends a graceful termination signal (SIGTERM) and waits for a timeout before forcefully killing the process if it hasn't exited; `docker kill` immediately force-terminates the container (SIGKILL) with no grace period.

- **Why would you use a restart policy of `unless-stopped` rather than `always` in production?**
  `unless-stopped` automatically restarts the container after crashes or host reboots, but respects a deliberate manual `docker stop`, not immediately restarting it; `always` would restart the container even after an intentional stop, which is usually not the desired behavior for routine maintenance operations.

- **Why is a Docker health check necessary in addition to Docker simply knowing a container's main process is still running?**
  A container's main process can remain technically "running" while the application inside it is actually broken or unresponsive (e.g., a hung database connection); a health check explicitly verifies the application is functioning correctly, giving Docker (and any orchestrator built on top of it) accurate information for restart/routing decisions that just checking process liveness wouldn't provide.
