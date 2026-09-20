# 01. REST Principles

## What is REST?

REST (**Representational State Transfer**) is an architectural style for designing networked applications, introduced by Roy Fielding in his 2000 doctoral dissertation. A REST**ful** API is one that follows REST's constraints to expose resources over HTTP in a predictable, stateless, uniform way.

REST is not a protocol or standard — it's a set of architectural constraints. An API is "RESTful" to the degree it follows these constraints.

## The Six Constraints of REST

### 1. Client–Server Separation

The client (UI/consumer) and server (data/logic) are independent. Either can evolve independently as long as the interface between them stays consistent.

```
[Client: React app] <--HTTP--> [Server: Express API] <---> [Database]
```

### 2. Statelessness

Each request from the client must contain **all** the information needed to process it. The server does not store any client session state between requests.

```js
// BAD (stateful): server remembers "logged in" state in memory between requests
// GOOD (stateless): client sends proof of identity with every request
app.get("/profile", (req, res) => {
  const token = req.headers.authorization; // client sends auth on every request
  const user = verifyToken(token);
  res.json(user);
});
```

Benefits: scalability (any server instance can handle any request — no "sticky sessions" needed), simpler server logic, easier horizontal scaling.

### 3. Cacheability

Responses must explicitly (or implicitly) define themselves as cacheable or non-cacheable, so clients/intermediaries know if they can reuse a response.

```js
res.set("Cache-Control", "public, max-age=3600"); // cache for 1 hour
res.set("ETag", generateETag(data));
```

### 4. Uniform Interface

The core idea that makes REST "REST." It has four sub-constraints:

- **Resource identification in requests** — resources are identified via URIs (`/users/42`).
- **Resource manipulation through representations** — clients modify resources by sending representations (typically JSON) of the desired state.
- **Self-descriptive messages** — each message includes enough info to describe how to process it (e.g., `Content-Type: application/json`).
- **HATEOAS** (Hypermedia as the Engine of Application State) — responses include links to related actions/resources (rarely fully implemented in practice, but part of the "pure" REST definition).

```json
{
  "id": 42,
  "name": "Alice",
  "links": {
    "self": "/users/42",
    "orders": "/users/42/orders"
  }
}
```

### 5. Layered System

A client can't necessarily tell whether it's connected directly to the end server or to an intermediary (load balancer, cache, gateway). Layers can be added transparently.

```
Client -> CDN -> Load Balancer -> API Gateway -> App Server -> Database
```

### 6. Code on Demand (optional)

Servers can optionally extend client functionality by transferring executable code (e.g., JavaScript). This is the only **optional** constraint — most APIs don't use it.

## Resources: The Core Concept

Everything in REST revolves around **resources** — nouns, not actions. A resource is any entity that can be named, addressed, and represented: a user, an order, a product, etc.

| Bad (verb-based, RPC-style) | Good (resource-based, RESTful) |
| --------------------------- | ------------------------------ |
| `POST /createUser`          | `POST /users`                  |
| `GET /getUserById?id=5`     | `GET /users/5`                 |
| `POST /deleteUser`          | `DELETE /users/5`              |
| `POST /updateUserEmail`     | `PATCH /users/5`               |

The **HTTP method** conveys the action; the **URL** identifies the resource.

## Resource Naming Conventions

```
GET    /products              -> list of products
GET    /products/17           -> a specific product
POST   /products               -> create a new product
PUT    /products/17           -> replace product 17
PATCH  /products/17           -> partially update product 17
DELETE /products/17           -> delete product 17

GET    /products/17/reviews    -> nested resource (reviews belonging to product 17)
```

Rules of thumb:

- Use **plural nouns** for collections (`/users`, not `/user`).
- Use **nouns, never verbs**, in the URL path.
- Use **lowercase**, hyphen-separated words for multi-word resources (`/order-items`, not `/orderItems` or `/OrderItems`).
- Nest resources to express relationships, but avoid deep nesting beyond 2 levels (`/users/5/orders/12/items` gets unwieldy — consider `/order-items?orderId=12` instead).

## Statelessness in Practice (Example)

```js
// Every request carries its own auth — no server-side session memory
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  req.user = verifyJWT(token); // stateless auth via JWT
  next();
});
```

## REST vs RPC vs GraphQL (Conceptual Comparison)

|                     | REST                               | RPC                              | GraphQL                                    |
| ------------------- | ---------------------------------- | -------------------------------- | ------------------------------------------ |
| Structure           | Resource-based URLs                | Action/procedure-based endpoints | Single endpoint, query-based               |
| Verbs               | HTTP methods (GET/POST/PUT/DELETE) | Custom function names            | Queries/Mutations                          |
| Over/under-fetching | Common issue                       | Common issue                     | Solved by design (client specifies fields) |
| Caching             | Easy (HTTP caching semantics)      | Harder                           | Harder (needs custom solutions)            |
| Learning curve      | Low, ubiquitous                    | Low                              | Higher                                     |

## Richardson Maturity Model (Levels of RESTfulness)

A framework for grading how "RESTful" an API really is:

| Level | Description                                                                                   |
| ----- | --------------------------------------------------------------------------------------------- |
| **0** | Single URI, single HTTP method (e.g., POST-only RPC-style) — not RESTful                      |
| **1** | Multiple URIs (resources), but still mostly one HTTP method                                   |
| **2** | Resources + proper HTTP methods + status codes — most real-world "REST APIs" stop here        |
| **3** | Full HATEOAS — responses include hypermedia links guiding the client on possible next actions |

Most production APIs operate at **Level 2** — this is considered pragmatically "RESTful enough" by industry standards.

## Common Interview-Style Questions

- **What are the core constraints of REST?**
  Client-server separation, statelessness, cacheability, uniform interface, layered system, and (optionally) code on demand.

- **Why is statelessness important for scalability?**
  Since no session state is stored on any particular server, requests can be routed to any server instance, enabling easy horizontal scaling and load balancing without "sticky sessions."

- **What does HATEOAS mean, and is it commonly implemented?**
  Hypermedia as the Engine of Application State — responses include links describing related/available actions. It's part of "pure" REST but rarely fully implemented in practice; most APIs are "Level 2" on the Richardson Maturity Model.

- **How should resources be named in a RESTful URL?**
  As plural nouns representing entities (`/users`, `/orders`), never verbs — the HTTP method conveys the action, not the URL.
