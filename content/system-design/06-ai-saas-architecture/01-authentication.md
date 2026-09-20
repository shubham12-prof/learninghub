# Authentication (for AI SaaS)

## What's the same as any SaaS product

- Standard user authentication: email/password, OAuth/social login, or
  enterprise SSO (SAML/OIDC) depending on target customer segment
  (consumer vs. B2B/enterprise).
- Session management via short-lived access tokens (JWTs or opaque tokens)
  plus longer-lived refresh tokens.
- **Multi-tenancy** — most B2B AI SaaS products are organized around
  organizations/workspaces, not just individual users: a user belongs to
  one or more orgs, and resources (documents, conversations, API keys) are
  scoped to an org, not a single user.

## What's specific to AI SaaS

### API keys for programmatic access

Beyond the web UI's session-based auth, most AI SaaS products expose their
own API (so customers can integrate the AI feature into their own
products) and need a separate **API key** system:

- Keys are typically scoped to an org/workspace, with the ability to
  create multiple keys (e.g., per environment: dev/staging/prod) and
  revoke individually.
- Store only a **hash** of the key server-side (like a password), showing
  the raw key to the user exactly once at creation — if the key is ever
  needed for display again, it can't be, by design.
- Keys should carry **scopes/permissions** (e.g., read-only vs. can
  trigger generation vs. admin) rather than being all-or-nothing,
  especially since a leaked key with full access is a much bigger incident
  than a leaked key scoped to one feature.

### Authorization for AI feature access

- **Plan-gating** — which AI features/models a user can access often
  depends on their subscription tier (e.g., only paid plans get access to
  a more expensive/capable model, or advanced features like fine-tuning).
  This check needs to happen at the point of triggering an AI call, not
  just at the UI level (a determined user could call the API directly,
  bypassing UI-level restrictions).
- **Rate/usage limits tied to identity** — beyond simple allow/deny, many
  AI SaaS products throttle by plan tier (see billing/rate-limiter
  overlap) — the auth layer needs to resolve "who is this, and what are
  they allowed to consume" as a single lookup, since it's checked on
  every AI request, not just at login.
- **Resource-level authorization** — a user should only be able to access
  their own (or their org's) conversations/documents/generated content;
  this is standard object-level authorization, but worth naming explicitly
  since AI products often store sensitive user content (prompts, uploaded
  documents) that must not leak across tenants — a serious risk in
  multi-tenant AI systems if authorization checks are missed on any
  data-access path, including internal admin/debugging tools.

## Authentication with third-party AI providers

- Your backend's calls to the underlying AI provider (OpenAI, Anthropic,
  etc.) use **your own** provider credentials, not the end user's — the
  end user authenticates to _your_ product; your product authenticates to
  the AI provider on their behalf, and meters/bills usage back to the
  correct user/org internally (see billing note). This indirection is
  worth stating explicitly, since it's the reason billing/metering exists
  as its own concern — the provider doesn't know or care which of your
  end users triggered a given call.
- Provider API keys/credentials should be stored in a secrets manager, not
  in application config/environment variables directly checked into code
  or loosely accessible — a standard but important detail to mention.

## Interview-relevant talking points

- Be ready to explain the two-layer credential model clearly: end-user
  auth to your product, and your product's separate auth to the AI
  provider — a common point of confusion if not stated explicitly.
- Emphasize that plan/feature gating must be enforced server-side at the
  point of the AI call, not just hidden in the UI — a classic security
  gap in real products.
- Bring up multi-tenant data isolation as a specific, serious risk for AI
  products given the sensitivity of stored prompts/documents — a good
  proactive point to raise.
