# 06. Ingress

## What is Ingress?

Ingress manages external HTTP/HTTPS access to Services within a cluster, providing URL-path-based and host-based routing, SSL/TLS termination, and a single entry point — conceptually similar to a Layer 7 reverse proxy/load balancer (covered in the Scaling module) but implemented as a native Kubernetes resource.

```
Internet -> Ingress -> routes based on hostname/path -> Service A / Service B / Service C
                                                              │           │           │
                                                            Pods        Pods        Pods
```

## Why Ingress Instead of Just Using `LoadBalancer` Services?

A `LoadBalancer`-type Service provisions one external load balancer **per Service** — if you have 10 services needing external access, that's potentially 10 separate cloud load balancers (with 10 separate costs and IP addresses). Ingress lets you expose many services through a **single** entry point, routing based on hostname/path.

```
Without Ingress:  api.example.com  -> LoadBalancer Service #1 -> api-service
                   admin.example.com -> LoadBalancer Service #2 -> admin-service
                   (multiple external load balancers, multiple costs)

With Ingress:       api.example.com  -> \
                     admin.example.com -> Ingress (ONE load balancer) -> routes internally to the right Service
```

## Ingress Requires an Ingress Controller

Ingress **resources** (the YAML you write) are just routing rules — they don't do anything on their own. An **Ingress Controller** (a separate piece of software running in the cluster) actually reads these rules and implements the routing.

```
Ingress resource (declarative rules)  +  Ingress Controller (the actual proxy/load balancer implementation)
                                                = working external routing
```

| Popular Ingress Controllers      | Notes                                                            |
| -------------------------------- | ---------------------------------------------------------------- |
| **NGINX Ingress Controller**     | Extremely widely used, community-maintained                      |
| **Traefik**                      | Modern, feature-rich, popular in cloud-native setups             |
| **AWS Load Balancer Controller** | Integrates with AWS ALB directly                                 |
| **Google Cloud (GKE) Ingress**   | Native GCP integration                                           |
| **Istio Gateway**                | Part of the Istio service mesh, more advanced traffic management |

Kubernetes doesn't ship with a default Ingress controller — you must explicitly install one.

## Basic Ingress Resource

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
```

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
kubectl describe ingress my-app-ingress
```

## Path-Based Routing

```yaml
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /admin
            pathType: Prefix
            backend:
              service:
                name: admin-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

```
myapp.example.com/api/*    -> api-service
myapp.example.com/admin/*    -> admin-service
myapp.example.com/*             -> frontend-service (catch-all, listed last)
```

## Host-Based Routing (Multiple Domains, One Ingress)

```yaml
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
    - host: admin.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin-service
                port:
                  number: 80
```

## `pathType` — Matching Behavior

```
Exact:  matches the URL path exactly, character for character
Prefix:  matches based on a URL path PREFIX, split by "/" — e.g., "/api" matches "/api", "/api/users", etc.
ImplementationSpecific: matching behavior depends entirely on the specific Ingress Controller in use
```

## TLS/SSL Termination

```yaml
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls-secret # references a TLS-type Secret (cert + key)
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
```

```bash
kubectl create secret tls myapp-tls-secret --cert=cert.crt --key=cert.key
```

The Ingress Controller handles HTTPS termination at this layer — traffic between the client and the Ingress is encrypted, while traffic from the Ingress to internal Services can remain plain HTTP (since it stays within the cluster's internal network).

## Automated Certificate Management with cert-manager

Manually managing TLS certificates (renewal, rotation) doesn't scale — **cert-manager** is the standard tool for automatically provisioning and renewing certificates (commonly via Let's Encrypt) directly within Kubernetes.

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-tls
spec:
  secretName: myapp-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - myapp.example.com
```

```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod # commonly added directly on the Ingress resource
```

cert-manager automatically requests, validates, and renews the certificate, keeping the referenced Secret up to date — a near-universal companion tool alongside Ingress in real production clusters.

## Ingress Controller-Specific Annotations

Since core Ingress functionality is somewhat minimal, controllers extend behavior via annotations for controller-specific features (rate limiting, custom headers, redirect rules, authentication).

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

> **Important nuance:** these annotations are entirely specific to whichever Ingress Controller you're using — an NGINX-specific annotation does nothing on a Traefik-based cluster, a common source of confusion when copying example YAML between different setups.

## Ingress vs Service vs API Gateway — Where Ingress Fits

```
Service (ClusterIP/NodePort/LoadBalancer): basic network exposure/load balancing, no HTTP-aware routing
Ingress:                                     HTTP/HTTPS-aware routing (host/path-based), TLS termination,
                                              a single external entry point for many services
API Gateway (e.g., Kong, Ambassador,           Ingress PLUS additional API-management concerns:
built on top of / alongside Ingress)             authentication, rate limiting, request transformation,
                                                  API versioning — often layered on top of or instead of
                                                  a basic Ingress Controller for more sophisticated needs
```

## Common Interview-Style Questions

- **What problem does Ingress solve that a `LoadBalancer` Service doesn't?**
  A `LoadBalancer` Service provisions a separate external load balancer per Service, which becomes costly and unwieldy with many services needing external access; Ingress lets many services be exposed through a single entry point, with host- and path-based routing directing traffic to the correct internal Service.

- **Why doesn't creating an Ingress resource alone accomplish anything?**
  An Ingress resource only declares routing rules — it requires a separately-installed Ingress Controller (like NGINX Ingress Controller or Traefik) actually running in the cluster to read those rules and implement the real proxying/load-balancing behavior; Kubernetes doesn't ship with a default controller.

- **How does TLS termination typically work with Ingress?**
  The Ingress resource references a TLS-type Secret containing a certificate and private key; the Ingress Controller uses this to terminate HTTPS at that layer, decrypting client traffic there while typically forwarding plain HTTP to internal Services within the cluster's private network.

- **What role does cert-manager play alongside Ingress?**
  It automates the provisioning, validation, and renewal of TLS certificates (commonly via Let's Encrypt), keeping the Secret an Ingress references automatically up to date — eliminating the operational burden of manually managing certificate lifecycles.

- **Why are Ingress annotations not portable across different Ingress Controllers?**
  Core Ingress functionality is intentionally minimal (basic host/path routing and TLS), so controller-specific features (rate limiting, custom redirect behavior, authentication) are implemented via annotations that only that specific controller's implementation understands — an annotation meaningful to NGINX Ingress Controller does nothing if the cluster is actually running Traefik or a different controller.
