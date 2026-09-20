# 08. Replication

## What is Replication?

Replication maintains multiple copies of the same data across different MongoDB servers (called a **replica set**), providing:

- **High availability** — if the primary server fails, another can take over automatically.
- **Data redundancy** — protection against data loss from hardware failure.
- **Read scalability** — read traffic can optionally be distributed across secondary members.
- **Disaster recovery** — geographically distributed replicas protect against regional outages.

## Replica Set Architecture

A replica set consists of multiple `mongod` instances, typically:

```
        ┌───────────┐
        │  Primary   │  <- accepts all writes
        └─────┬─────┘
       replicates data
      ┌────────┴────────┐
┌─────▼─────┐      ┌─────▼─────┐
│ Secondary  │      │ Secondary  │  <- replicate from primary, can serve reads
└───────────┘      └───────────┘
```

- **Primary** — the only member that accepts write operations. There's exactly one primary at any time.
- **Secondaries** — replicate data from the primary via the **oplog** (operations log) and can optionally serve read traffic.
- **Arbiter** (optional) — participates in elections to break ties but holds no data — used to maintain an odd number of voting members without the cost of a full data-bearing node.

## The Oplog (Operations Log)

The primary records every write operation to a special capped collection called the **oplog** (`local.oplog.rs`). Secondaries continuously tail this oplog and apply the same operations to stay in sync — this is the core mechanism behind replication.

```js
rs.printReplicationInfo(); // shows oplog size and time range covered
```

## Setting Up a Replica Set (Local Development Example)

```bash
mongod --replSet "rs0" --port 27017 --dbpath /data/db1
mongod --replSet "rs0" --port 27018 --dbpath /data/db2
mongod --replSet "rs0" --port 27019 --dbpath /data/db3
```

```js
// Connect to one instance and initiate the replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" },
  ],
});

rs.status(); // check replica set health/roles
```

## Automatic Failover Election

If the primary becomes unreachable (crash, network partition), the remaining secondaries hold an **election** to choose a new primary — typically completing within a few seconds, minimizing downtime.

```
Primary goes down
     │
     ▼
Secondaries detect the loss (via heartbeat timeout)
     │
     ▼
Election held among eligible secondaries
     │
     ▼
New Primary elected -> writes resume
```

An odd number of voting members (3, 5, 7...) is recommended to avoid split-vote ties during elections.

## Read Preferences

By default, all reads go to the primary (ensuring strong consistency), but you can configure clients to read from secondaries for load distribution or geographic proximity — at the cost of potentially reading slightly stale data (replication lag).

```js
const { MongoClient, ReadPreference } = require("mongodb");

const client = new MongoClient(uri, {
  readPreference: ReadPreference.SECONDARY_PREFERRED,
});
```

| Read Preference      | Behavior                                                  |
| -------------------- | --------------------------------------------------------- |
| `primary` (default)  | Always read from primary — strongest consistency          |
| `primaryPreferred`   | Primary if available, else a secondary                    |
| `secondary`          | Always read from a secondary                              |
| `secondaryPreferred` | Secondary if available, else primary                      |
| `nearest`            | Read from whichever member has the lowest network latency |

## Replication Lag

Secondaries apply oplog entries **asynchronously**, so there's always some delay (usually milliseconds, but can grow under heavy load or network issues) between a write on the primary and its visibility on secondaries.

```js
rs.printSecondaryReplicationInfo(); // shows lag per secondary
```

Reading from a secondary means you might see slightly outdated data — an important trade-off to understand before enabling secondary reads for a given use case.

## Write Concern — Controlling Durability Guarantees

```js
db.orders.insertOne(
  { productId: 1, quantity: 2 },
  { writeConcern: { w: "majority", wtimeout: 5000 } },
);
```

| Write Concern    | Meaning                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `w: 1` (default) | Acknowledged once the primary has written it                                                                  |
| `w: "majority"`  | Acknowledged once a majority of replica set members have written it — safer against data loss during failover |
| `w: 0`           | No acknowledgment requested — fastest but no durability guarantee                                             |
| `j: true`        | Additionally require the write to be journaled to disk                                                        |

## Read Concern — Controlling Consistency Guarantees

```js
db.orders.find().readConcern("majority");
```

| Read Concern      | Meaning                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `local` (default) | Returns the most recent data available on that node, without guaranteeing it's been replicated |
| `majority`        | Returns data acknowledged by a majority of replica set members — won't be rolled back          |
| `linearizable`    | Strongest guarantee — reflects all successful majority-acknowledged writes prior to the read   |

## Priority and Hidden Members

```js
cfg = rs.conf();
cfg.members[1].priority = 0.5; // less likely to become primary
cfg.members[2].hidden = true; // hidden member — invisible to client read preference routing, useful for dedicated backup/analytics nodes
cfg.members[2].priority = 0; // hidden members must have priority 0
rs.reconfig(cfg);
```

Hidden members are useful for dedicated backup or reporting workloads that shouldn't receive regular application read traffic.

## Common Interview-Style Questions

- **What is a MongoDB replica set, and why is it used?**
  A group of `mongod` instances maintaining copies of the same data, providing high availability (automatic failover), data redundancy, and optional read scaling; one member is the primary (accepts writes), and the rest are secondaries (replicate from the primary).

- **What is the oplog, and what role does it play in replication?**
  A capped collection on the primary recording every write operation; secondaries continuously tail and apply these operations to stay synchronized with the primary.

- **What happens when a primary becomes unavailable?**
  The remaining secondaries detect the loss via heartbeat timeout and hold an election to choose a new primary, typically completing within seconds to minimize write downtime.

- **What's the trade-off of reading from secondary members instead of the primary?**
  Potentially reading stale data due to replication lag (secondaries apply oplog entries asynchronously), in exchange for distributing read load and/or reducing latency via geographic proximity.

- **What does `writeConcern: { w: "majority" }` guarantee, and why use it?**
  The write is only acknowledged once a majority of replica set members have durably recorded it, protecting against data loss if the primary fails immediately after a write — stronger durability than the default `w: 1`, at the cost of slightly higher write latency.
