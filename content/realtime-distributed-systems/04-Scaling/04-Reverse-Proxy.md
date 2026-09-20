# 04. Reverse Proxy

## What is a Reverse Proxy?

A reverse proxy sits in front of one or more backend servers, receiving client requests on their behalf and forwarding them to the appropriate backend — the client only ever talks to the proxy, with no direct knowledge of (or connection to) the actual backend server(s) handling the request.

```
Client ---> Reverse Proxy ---> Backend Server(s)
       (client only knows      (actual application logic lives here,
        about the proxy)        hidden from the client)
```

## Reverse Proxy vs Forward Proxy — A Common Point of Confusion

|                  | Forward Proxy                                                         | Reverse Proxy                                      |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| Sits in front of | The **client** (acting on the client's behalf)                        | The **server** (acting on the server's behalf)     |
| Hides            | The client's identity from the server                                 | The server's identity/architecture from the client |
| Common use case  | Corporate network content filtering, VPNs, bypassing geo-restrictions | Load balancing, SSL termination, caching, security |

```
Forward Proxy:  Client -> Forward Proxy -> Internet
                (proxy acts on behalf of the CLIENT)

Reverse Proxy:  Internet -> Reverse Proxy -> Backend Servers
                (proxy acts on behalf of the SERVER)
```

## Core Responsibilities of a Reverse Proxy

### 1. Load Balancing

Distributing incoming requests across multiple backend instances (full detail in the dedicated Load Balancers notes) — many reverse proxies (Nginx, HAProxy) serve double duty as load balancers.

```nginx
upstream backend {
  server backend1.internal:3000;
  server backend2.internal:3000;
  server backend3.internal:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}
```

### 2. SSL/TLS Termination

The reverse proxy handles HTTPS encryption/decryption, letting backend servers communicate over plain HTTP internally — simplifying certificate management (one place to configure/renew certs) and offloading the computational cost of encryption from application servers.

```nginx
server {
  listen 443 ssl;
  ssl_certificate /etc/ssl/certs/example.com.crt;
  ssl_certificate_key /etc/ssl/private/example.com.key;

  location / {
    proxy_pass http://backend; # plain HTTP to the backend, HTTPS only at the proxy edge
  }
}
```

### 3. Caching

Reverse proxies can cache responses, serving repeated requests without hitting the backend at all — similar in concept to a CDN, but typically deployed closer to (or alongside) the origin infrastructure rather than globally distributed at the network edge.

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;

server {
  location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m; # cache successful responses for 10 minutes
    proxy_pass http://backend;
  }
}
```

### 4. Security / Hiding Backend Architecture

Clients never directly interact with backend servers, so internal architecture details (server versions, internal IPs, technology stack) stay hidden — reducing the attack surface and making it harder for attackers to target specific backend vulnerabilities directly.

```nginx
server {
  location / {
    proxy_pass http://backend;
    proxy_hide_header X-Powered-By; # strip revealing headers before they reach the client
  }
}
```

### 5. Compression

```nginx
gzip on;
gzip_types text/plain application/json text/css application/javascript;
```

### 6. Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
  location /api/ {
    limit_req zone=api_limit burst=20;
    proxy_pass http://backend;
  }
}
```

### 7. Request Routing (Path-Based / Host-Based)

```nginx
server {
  location /api/users/ {
    proxy_pass http://user-service;
  }
  location /api/orders/ {
    proxy_pass http://order-service;
  }
  location / {
    proxy_pass http://frontend-service;
  }
}
```

This effectively makes the reverse proxy act as an API gateway, routing different URL paths to entirely different backend services — a common pattern in microservice architectures.

## Popular Reverse Proxy Software

| Tool                               | Notes                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Nginx**                          | Extremely widely used, high performance, also commonly used as a static file server/CDN-adjacent tool |
| **HAProxy**                        | High-performance, especially strong for TCP/Layer 4 and advanced Layer 7 load balancing               |
| **Apache HTTP Server (mod_proxy)** | Older but still common, especially in legacy environments                                             |
| **Traefik**                        | Modern, container/Kubernetes-native, automatic service discovery integration                          |
| **Envoy**                          | Modern, feature-rich, commonly used in service mesh architectures (Istio)                             |
| **Caddy**                          | Simple configuration, automatic HTTPS certificate management out of the box                           |

## Reverse Proxy in a Node.js/Express Deployment (Common Pattern)

A very common production pattern: run Nginx in front of a Node.js application, rather than exposing the Node.js process directly to the internet.

```
Internet ---> Nginx (port 443, HTTPS) ---> Node.js app (port 3000, plain HTTP, internal only)
```

```nginx
server {
  listen 443 ssl;
  server_name api.example.com;

  ssl_certificate /etc/ssl/certs/api.example.com.crt;
  ssl_certificate_key /etc/ssl/private/api.example.com.key;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Why `X-Forwarded-*` Headers Matter

Since the Node.js app now only ever sees requests coming from Nginx (localhost), it loses direct visibility into the real client's IP address and original protocol — the reverse proxy forwards this information via headers instead.

```js
// Express — trust the reverse proxy to correctly read forwarded headers
app.set("trust proxy", true);

app.get("/", (req, res) => {
  console.log(req.ip); // correctly reflects the REAL client IP, not Nginx's localhost address,
  // because Express reads X-Forwarded-For when trust proxy is enabled
});
```

(This exact configuration point is also covered in the Express Request Object notes, since it's a common source of bugs when deploying behind any reverse proxy/load balancer.)

## Reverse Proxy vs API Gateway vs Load Balancer — Overlapping but Distinct Concepts

|                   | Primary Focus                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Reverse Proxy** | General-purpose intermediary — can do load balancing, caching, SSL termination, routing, etc.                                         |
| **Load Balancer** | Specifically focused on distributing traffic across multiple backend instances                                                        |
| **API Gateway**   | Focused specifically on API-level concerns — authentication, rate limiting, request/response transformation, routing to microservices |

In practice, these terms overlap significantly, and a single piece of software (Nginx, Envoy, Traefik) often serves multiple of these roles simultaneously — the distinction is more about the primary use case being emphasized than a strict technical boundary.

## Common Interview-Style Questions

- **What is a reverse proxy, and how does it differ from a forward proxy?**
  A reverse proxy sits in front of backend servers, handling requests on the server's behalf and hiding backend architecture from clients; a forward proxy sits in front of clients, acting on their behalf (e.g., for content filtering or anonymity) — the key distinction is which side of the connection the proxy represents.

- **Why is SSL/TLS termination at a reverse proxy commonly used, instead of handling HTTPS directly in each application server?**
  It centralizes certificate management (one place to configure and renew certificates rather than every backend instance), offloads the computational cost of encryption/decryption from application servers, and allows backend servers to communicate over simpler plain HTTP internally.

- **Why do you need to configure `trust proxy` (or equivalent) in an application server deployed behind a reverse proxy?**
  Without it, the application only sees requests originating from the proxy itself (e.g., localhost), losing visibility into the real client's IP address and original protocol; enabling trust proxy tells the framework to read this information from `X-Forwarded-For`/`X-Forwarded-Proto` headers that the reverse proxy adds.

- **How can a reverse proxy improve security beyond just routing traffic?**
  By hiding internal backend architecture details (server versions, internal IPs, technology stack) from clients, stripping revealing response headers, enforcing rate limiting, and serving as a single, centrally-managed point for security policies rather than needing to configure every backend instance individually.

- **What's the difference between a reverse proxy, a load balancer, and an API gateway?**
  They overlap significantly and are often implemented by the same software; a reverse proxy is the general-purpose category (routing, caching, SSL termination, etc.), a load balancer specifically focuses on distributing traffic across backend instances, and an API gateway focuses specifically on API-level concerns like authentication, rate limiting, and request/response transformation for microservices.
