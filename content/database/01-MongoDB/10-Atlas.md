# 10. Atlas

## What is MongoDB Atlas?

MongoDB Atlas is MongoDB's official **fully-managed, cloud-hosted database-as-a-service**. It handles provisioning, replication, sharding, backups, scaling, monitoring, and security patching, letting teams run production MongoDB clusters without managing the underlying infrastructure themselves. Available on AWS, Google Cloud, and Azure.

## Why Use Atlas Instead of Self-Hosting MongoDB?

|                   | Self-Hosted MongoDB                                       | MongoDB Atlas                                                   |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Setup             | Manual install/config of replica sets, sharding           | Few clicks in a web UI or infrastructure-as-code                |
| Backups           | You configure and manage backup jobs                      | Automated, continuous backups with point-in-time recovery       |
| Scaling           | Manual replica/shard management                           | Built-in vertical/horizontal scaling, including auto-scaling    |
| Monitoring        | Requires separate tooling (e.g., Ops Manager, Prometheus) | Built-in performance advisor, real-time metrics, alerts         |
| Security patching | Manual                                                    | Automatic                                                       |
| High availability | You configure and maintain replica sets                   | Multi-region, multi-cloud replica sets available out of the box |
| Cost              | Infrastructure cost + ops overhead                        | Usage-based pricing (includes a free tier)                      |

## Creating a Cluster (High-Level Steps)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a **Project**, then a **Cluster** (choose cloud provider, region, tier — including a free `M0` tier for learning/small projects).
3. Configure **Database Access** — create a database user with a username/password or other auth method.
4. Configure **Network Access** — whitelist IP addresses (or `0.0.0.0/0` for open access, not recommended for production) that can connect to the cluster.
5. Get the **connection string** from the "Connect" button.

## Connection String Format

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
```

```js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // never hard-code credentials
const client = new MongoClient(uri);

async function connect() {
  await client.connect();
  console.log("Connected to Atlas");
}
```

With Mongoose:

```js
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to Atlas"))
  .catch((err) => console.error("Connection error:", err));
```

## Atlas Cluster Tiers

| Tier       | Description                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `M0`       | Free tier — shared resources, 512MB storage, good for learning/prototyping                                       |
| `M2`/`M5`  | Low-cost shared tiers, still shared infrastructure                                                               |
| `M10`+     | Dedicated clusters — dedicated compute/storage, production-ready, support for auto-scaling, backups, VPC peering |
| Serverless | Pay-per-operation pricing, auto-scales instantly, good for unpredictable/spiky workloads                         |

## Key Atlas Features

### Automated Backups & Point-in-Time Recovery

Atlas continuously backs up data (on dedicated tiers) and allows restoring to any specific point in time within the retention window — critical for recovering from accidental data corruption or deletion.

### Atlas Search

Built-in full-text search powered by Apache Lucene, integrated directly into the aggregation pipeline via `$search` — avoids needing a separate Elasticsearch deployment for many use cases.

```js
db.products.aggregate([
  {
    $search: {
      index: "default",
      text: { query: "wireless headphones", path: "name" },
    },
  },
]);
```

### Atlas Vector Search

Enables similarity search over vector embeddings directly within MongoDB — commonly used for AI/RAG (Retrieval-Augmented Generation) applications.

```js
db.products.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.12, 0.98 /* ... */],
      numCandidates: 100,
      limit: 10,
    },
  },
]);
```

### Performance Advisor

Automatically analyzes slow queries and suggests indexes that would improve performance — surfaced directly in the Atlas UI.

### Real-Time Monitoring & Alerts

Dashboards for CPU, memory, connections, query performance (operations/sec, slow queries), with configurable alerting (email, Slack, PagerDuty integration) on thresholds.

### VPC Peering & Private Endpoints

For production deployments, Atlas supports connecting your cloud infrastructure (AWS VPC, Azure VNet, GCP VPC) privately to your cluster, avoiding public internet exposure entirely.

### Global Clusters

Distributes data geographically across regions/zones (built on sharding + zoned sharding under the hood) for low-latency access and data residency compliance (e.g., keeping EU user data within the EU).

## Atlas CLI and Infrastructure-as-Code

```bash
# Atlas CLI — manage clusters from the terminal
atlas clusters create myCluster --provider AWS --region US_EAST_1 --tier M10
```

Atlas also has official **Terraform** and **CloudFormation** providers, letting teams manage Atlas infrastructure as code alongside the rest of their cloud infrastructure.

```hcl
resource "mongodbatlas_cluster" "cluster" {
  project_id = var.project_id
  name       = "myCluster"
  provider_name = "AWS"
  provider_region_name = "US_EAST_1"
  provider_instance_size_name = "M10"
}
```

## Security Best Practices on Atlas

- Never whitelist `0.0.0.0/0` in production — restrict Network Access to known IP ranges or use VPC peering/private endpoints.
- Use database users with the **least privilege necessary** (Atlas supports built-in and custom roles).
- Enable **encryption at rest** (enabled by default on Atlas) and **TLS in transit** (enforced by default).
- Rotate database credentials periodically, and store them in environment variables or a secrets manager — never commit them to source control.
- Enable **Atlas's audit log** feature (available on higher tiers) for compliance-sensitive workloads.

## Common Interview-Style Questions

- **What is MongoDB Atlas, and what problem does it solve?**
  A fully-managed cloud database service for MongoDB that handles provisioning, replication, backups, scaling, and security patching — removing the operational burden of self-hosting and managing MongoDB infrastructure.

- **What's the difference between Atlas's shared (M0-M5) and dedicated (M10+) tiers?**
  Shared tiers run on infrastructure shared with other Atlas customers (free/low-cost, good for learning/prototyping); dedicated tiers provide dedicated compute/storage resources and unlock production features like automated backups, VPC peering, and auto-scaling.

- **What is Atlas Search, and why might you use it instead of a separate search engine like Elasticsearch?**
  A built-in full-text search feature (powered by Apache Lucene) integrated directly into MongoDB's aggregation pipeline via `$search`, avoiding the operational overhead of running and syncing a separate search infrastructure for many common search use cases.

- **Why is whitelisting `0.0.0.0/0` in Atlas Network Access discouraged for production?**
  It allows connections from any IP address on the internet, significantly increasing the attack surface; production deployments should restrict access to known IP ranges or use private connectivity (VPC peering/private endpoints) instead.
