# 05. Clustering

## Why Clustering Matters for Node.js

Node.js runs JavaScript on a **single thread** by default — even on a machine with 16 CPU cores, a default Node.js process only ever utilizes one of them for executing your application code. Clustering spawns multiple Node.js worker processes (typically one per CPU core), all sharing the same server port, letting your application actually take advantage of all available cores on a machine.

```
Single process (default):    1 process -> uses 1 CPU core -> other 15 cores sit IDLE for this app

Clustered (N processes):       N processes (one per core) -> uses ALL cores -> dramatically
                                higher throughput for CPU-bound and even I/O-bound workloads
                                under concurrent load
```

## The Built-in `cluster` Module

```js
const cluster = require("cluster");
const os = require("os");
const http = require("http");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(
    `Primary process ${process.pid} is running, forking ${numCPUs} workers`,
  );

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died, forking a replacement`);
    cluster.fork(); // automatically replace a crashed worker — basic self-healing
  });
} else {
  // Worker processes each run an independent copy of the actual application/server
  http
    .createServer((req, res) => {
      res.end(`Handled by worker ${process.pid}`);
    })
    .listen(3000);

  console.log(`Worker ${process.pid} started`);
}
```

```
Primary process: doesn't handle requests itself — its job is to fork/manage workers
Worker processes:  each is a FULL, independent Node.js process, running the actual application,
                    all listening on the SAME port (the OS/cluster module load-balances
                    incoming connections across them)
```

## How Load Balancing Across Workers Works

```
On most platforms, the cluster module uses a round-robin approach by default (cluster.SCHED_RR)
-> incoming connections are distributed across worker processes roughly evenly

(Windows historically used a different default — cluster.SCHED_NONE, letting the OS decide —
 though this has evolved; round-robin is the more commonly relevant default to know)
```

```js
cluster.schedulingPolicy = cluster.SCHED_RR; // explicitly set round-robin (the common default on most platforms)
```

## Critical Limitation: Workers Don't Share Memory

Each worker is a **completely separate process** with its own memory space — no in-memory state (variables, caches, in-memory session stores) is automatically shared between workers.

```js
// BROKEN in a clustered environment — each worker has its OWN separate copy of this variable
let requestCount = 0;
app.get("/", (req, res) => {
  requestCount++; // only increments THIS worker's local copy — other workers have a DIFFERENT count
  res.send(`Count: ${requestCount}`);
});
```

```js
// CORRECT — shared state must live in an EXTERNAL store all workers can access
app.get("/", async (req, res) => {
  const count = await redis.incr("request_count"); // Redis is the shared source of truth, not process memory
  res.send(`Count: ${count}`);
});
```

This is precisely why the "externalize state" principle covered in the Scaling module (Redis session stores, shared caches) matters just as much for clustering _within a single machine_ as it does for horizontal scaling _across multiple machines_ — clustering has effectively the same stateless-application requirement.

## Sticky Sessions in a Clustered Environment

If an application relies on in-memory session data tied to a specific worker (generally discouraged, per the above), requests from the same client need to consistently reach the same worker process — requiring a sticky session mechanism at the load-balancing layer, similar to the concept covered in the Scaling module's Load Balancers notes.

```js
// Using a library like "sticky-session" to route based on client IP
const sticky = require("sticky-session");

if (!sticky.listen(server, 3000)) {
  server.once("listening", () => console.log("Server started"));
} else {
  // primary process logic
}
```

**Better practice:** avoid needing sticky sessions at all by externalizing state (Redis) — it sidesteps this entire category of complexity and works correctly whether you're clustering, horizontally scaling across machines, or both.

## PM2 — A Production-Ready Process Manager (Simplifying Clustering)

Rather than hand-rolling cluster management (fork logic, crash recovery, graceful reloads), most production Node.js deployments use a process manager like **PM2**, which handles clustering, automatic restarts, logging, and zero-downtime reloads out of the box.

```bash
npm install -g pm2
pm2 start server.js -i max   # "-i max" automatically clusters across ALL available CPU cores
```

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "my-app",
      script: "./server.js",
      instances: "max", // or a specific number
      exec_mode: "cluster",
      max_memory_restart: "500M", // automatically restart a worker if it exceeds this memory usage
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 monit                        # live monitoring dashboard
pm2 reload my-app                  # zero-downtime reload — restarts workers one at a time
```

PM2's `reload` (as opposed to `restart`) performs a rolling restart across cluster workers, keeping the application available throughout the deployment — conceptually similar to Kubernetes' rolling update strategy, but at the process level on a single machine.

## Clustering vs Kubernetes/Container Orchestration Horizontal Scaling

```
Clustering (within ONE machine):    multiple Node.js PROCESSES on a single machine,
                                      utilizing all its CPU cores

Horizontal scaling (across MACHINES): multiple CONTAINER/POD instances across potentially
                                        many different machines, coordinated by an orchestrator
                                        (Kubernetes, covered in its own module)
```

In a containerized/Kubernetes deployment, it's common to run each container as a **single** Node.js process (letting Kubernetes handle scaling via replica count/HPA instead) rather than also clustering _within_ each container — though clustering within a container is also a valid pattern (especially for larger container resource allocations), and the two approaches aren't mutually exclusive. The right choice often depends on how resource limits/requests are configured and how the orchestrator is expected to handle scaling.

```
Common pattern in Kubernetes:  1 process per container/Pod, scale via REPLICA COUNT (many Pods)
Alternative pattern:              cluster WITHIN each container/Pod too (multiple processes per Pod),
                                    combined with a smaller number of larger Pods — a genuine, sometimes-used
                                    trade-off depending on the specific resource/orchestration strategy
```

## Common Interview-Style Questions

- **Why does a default Node.js application fail to utilize all CPU cores on a multi-core machine, and how does clustering address this?**
  Node.js executes JavaScript on a single thread by default, so a single process can only actually use one CPU core regardless of how many are available; clustering forks multiple independent worker processes (typically one per core), all sharing the same listening port, letting the application collectively utilize all available cores.

- **Why can't you simply share an in-memory variable across cluster workers?**
  Each worker is a completely separate operating system process with its own isolated memory space — there's no automatic memory sharing between them, so a variable incremented in one worker's code has no effect on any other worker's separate copy of that same variable.

- **How should shared application state be handled in a clustered Node.js deployment?**
  It must live in an external store accessible to all workers (like Redis or a database) rather than in any individual worker's process memory — the same "externalize state" principle that applies to horizontal scaling across multiple machines applies equally within a single clustered machine.

- **What does PM2's `reload` command do differently from `restart`, and why does that matter?**
  `reload` performs a rolling restart, cycling through cluster workers one at a time so the application remains available throughout the process; `restart` would stop and start workers in a way that could cause a brief period of unavailability — `reload` is the appropriate choice for zero-downtime deployments in a clustered environment.

- **What's the difference between clustering and Kubernetes-style horizontal scaling?**
  Clustering runs multiple Node.js processes within a single machine to utilize all of its CPU cores; horizontal scaling (as managed by an orchestrator like Kubernetes) runs multiple container/Pod instances potentially across many different machines — they operate at different levels and aren't mutually exclusive, though a common containerized pattern favors one process per container and scales via replica count instead of also clustering within each container.
