# 05. Secrets

## What is a Kubernetes Secret?

A Secret is conceptually similar to a ConfigMap — key-value data made available to Pods — but specifically intended for **sensitive** information: passwords, API keys, tokens, TLS certificates. Secrets get slightly different handling from Kubernetes (like not being displayed in plain text in `kubectl get`), but a critical, commonly-misunderstood point: **Secrets are base64-encoded, not encrypted, by default.**

```
base64 encoding: TRIVIALLY reversible by anyone — NOT a security measure, just a text-safe encoding format
Encryption:        requires a key to reverse, actually provides confidentiality

Default Kubernetes Secrets: base64-ENCODED only — genuinely sensitive data protection requires
                             additional configuration (encryption at rest, RBAC restrictions, etc.)
```

## Creating a Secret

### Declaratively (YAML)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4= # base64 of "admin"
  password: c3VwZXJzZWNyZXQ= # base64 of "supersecret"
```

```bash
echo -n 'admin' | base64          # YWRtaW4=
echo -n 'supersecret' | base64      # c3VwZXJzZWNyZXQ=
```

### Using `stringData` — Avoiding Manual Base64 Encoding

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  username: admin # Kubernetes automatically base64-encodes this for you
  password: supersecret
```

`stringData` is generally more convenient — you write plain text, and Kubernetes handles the encoding automatically when the object is created/updated.

### Imperatively (CLI)

```bash
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=supersecret

kubectl create secret generic tls-secret \
  --from-file=tls.crt=./cert.crt \
  --from-file=tls.key=./cert.key
```

```bash
kubectl get secrets
kubectl describe secret db-credentials   # values are HIDDEN by default in describe output
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 -d   # decode to view the actual value
```

## Consuming a Secret — As Environment Variables

```yaml
spec:
  containers:
    - name: my-app
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
```

```yaml
envFrom:
  - secretRef:
      name: db-credentials # all keys become environment variables at once
```

## Consuming a Secret — As Mounted Files

```yaml
volumeMounts:
  - name: secret-volume
    mountPath: /etc/secrets
    readOnly: true
volumes:
  - name: secret-volume
    secret:
      secretName: db-credentials
```

```
/etc/secrets/username    <- file containing the decoded value
/etc/secrets/password      <- file containing the decoded value
```

**Security consideration:** mounting as files (rather than environment variables) is often considered somewhat safer, since environment variables are more easily accidentally leaked — via crash dumps/logs that print the full environment, or child processes inheriting them — whereas file-based secrets require an explicit read.

## Built-in Secret Types

```yaml
type: Opaque                            # generic, arbitrary key-value data — the default/most common type
type: kubernetes.io/tls                    # TLS certificate + private key, for HTTPS/Ingress
type: kubernetes.io/dockerconfigjson         # credentials for pulling images from a private container registry
type: kubernetes.io/basic-auth                 # username/password pair, in a standardized format
type: kubernetes.io/ssh-auth                     # SSH private key
```

### Example: Docker Registry Credentials (Pulling Private Images)

```bash
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.com \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=me@example.com
```

```yaml
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: my-app
      image: myregistry.com/private/myapp:1.0
```

### Example: TLS Secret for HTTPS

```bash
kubectl create secret tls my-tls-secret --cert=cert.crt --key=cert.key
```

Referenced directly by an Ingress resource for TLS termination (full detail in the Ingress notes).

## Encryption at Rest — Actually Securing Secrets

By default, Secrets are stored in `etcd` (Kubernetes' backing datastore) in their base64-encoded (not encrypted) form. Enabling genuine encryption at rest requires explicit cluster-level configuration.

```yaml
# EncryptionConfiguration, applied at the cluster/API server level (cluster-admin operation)
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources: ["secrets"]
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-encryption-key>
      - identity: {}
```

Most managed Kubernetes offerings (EKS, GKE, AKS) provide simpler, managed options for enabling encryption at rest (often integrated with the cloud provider's own key management service) rather than requiring this raw configuration directly.

## RBAC — Restricting Who Can Read Secrets

Since base64 encoding alone provides no real confidentiality, controlling **access** to Secrets via Kubernetes' Role-Based Access Control is the actual primary defense in most clusters.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
```

Restricting which users/service accounts can actually read Secret objects (rather than relying on the encoding itself) is the practical, primary layer of protection in most real-world cluster security postures.

## External Secret Management — A Common Production Pattern

Many production teams avoid storing genuinely sensitive secrets directly as native Kubernetes Secret objects at all, instead using an external secrets manager (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager) as the actual source of truth, with a tool syncing values into the cluster.

```
External Secrets Operator / Vault Agent / cloud-provider-specific integration:
  Watches a Kubernetes "ExternalSecret" resource (or similar)
    -> fetches the ACTUAL secret value from Vault/AWS Secrets Manager/etc.
    -> creates/updates a native Kubernetes Secret with that value automatically
```

```yaml
# Example: External Secrets Operator resource
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: db-credentials # the native K8s Secret this creates/syncs
  data:
    - secretKey: password
      remoteRef:
        key: production/db
        property: password
```

This pattern centralizes secret management, rotation, and auditing in a purpose-built system, using Kubernetes Secrets only as the final delivery mechanism into running Pods.

## Common Interview-Style Questions

- **Are Kubernetes Secrets encrypted by default?**
  No — they're only base64-encoded, which is trivially reversible and provides no real confidentiality on its own; genuine protection requires additional cluster-level configuration for encryption at rest, plus RBAC restrictions on who can read Secret objects.

- **What's the difference between `data` and `stringData` when defining a Secret?**
  `data` requires values to be manually pre-encoded in base64; `stringData` accepts plain text values, which Kubernetes automatically base64-encodes when the object is created or updated — `stringData` is generally more convenient for authoring.

- **Why might mounting a Secret as a file be considered somewhat safer than exposing it as an environment variable?**
  Environment variables can be more easily leaked accidentally — via crash dumps, logs that print the full process environment, or child processes automatically inheriting them — whereas a file-based secret requires an explicit read operation, providing a somewhat smaller accidental-exposure surface.

- **What is the actual primary defense mechanism for Kubernetes Secrets, given that base64 encoding provides no real security?**
  Role-Based Access Control (RBAC), restricting which users and service accounts are permitted to read Secret objects at all — combined with enabling encryption at rest at the cluster level for defense against direct access to the underlying `etcd` datastore.

- **Why might a production team choose to integrate an external secrets manager (like Vault or AWS Secrets Manager) rather than relying solely on native Kubernetes Secrets?**
  To centralize secret storage, rotation, and auditing in a purpose-built system with stronger security guarantees than Kubernetes' default base64 encoding, using native Kubernetes Secrets only as the final, automatically-synced delivery mechanism into running Pods rather than as the actual source of truth for sensitive values.
