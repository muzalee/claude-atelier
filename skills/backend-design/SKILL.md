---
name: backend-design
description: Create a backend design brief through an interactive interview, codebase exploration, and decisions about data model, auth, scale, consistency, deployment, and observability. Biased toward Fastify (Node) but works for any backend stack. Saved as a markdown file in the project. Use when user wants to plan a backend, design an API, define a data model, mention "backend brief", or pair with a frontend design brief.
---

This skill creates a backend design brief through structured conversation. It is the server-side counterpart to `design-brief`. Skip any question the codebase already answers — read first, then ask only what is unresolved.

## Example prompts

- "Write a backend brief for the notifications service"
- "Plan the backend for the checkout flow"
- "I need to think through the data model and auth before building this API"
- "Backend brief: a job queue that processes uploaded videos"

## Process

1. Ask the user for a one-paragraph description of what they want to build, who/what calls it, and any constraints they already have in mind (latency, region, compliance, expected scale).

2. Explore the existing codebase to learn what is already decided. Scan specifically for:

   **Fastify-specific (check first, since this is the primary stack)**
   - `fastify` in `package.json` and the server entry (often `server.ts`, `app.ts`, `src/server.ts`)
   - Plugin tree: every `fastify.register(...)` call and any files using `fastify-plugin` (`fp(...)`) — these define the encapsulation boundaries
   - Route definitions: `fastify.get/post/put/delete`, `fastify.route({...})`, route schemas (`schema: { body, querystring, params, response }`)
   - Schema strategy: raw JSON Schema, `@sinclair/typebox`, `fastify-type-provider-zod`, or `@fastify/type-provider-typebox`
   - Hooks in use: `onRequest`, `preParsing`, `preValidation`, `preHandler`, `preSerialization`, `onSend`, `onResponse`, `onError`
   - Decorators: `fastify.decorate(...)`, `fastify.decorateRequest(...)`, `fastify.decorateReply(...)` — these reveal cross-cutting concerns (auth context, db handle, current user)
   - Common ecosystem plugins already wired up: `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/jwt`, `@fastify/cookie`, `@fastify/session`, `@fastify/multipart`, `@fastify/static`, `@fastify/swagger`, `@fastify/under-pressure`, `@fastify/auth`, `@fastify/oauth2`, `@fastify/websocket`
   - Logger config: Pino is the default — check `logger: { ... }` options, `transport`, redaction config, log level per environment
   - Error handling: `setErrorHandler`, `setNotFoundHandler`, custom error classes
   - Server lifecycle: `fastify.ready()`, `fastify.listen(...)`, graceful shutdown (`closeWithGrace`, `@fastify/graceful-shutdown`)

   **Other backends (scan if Fastify isn't present, or to identify hybrid setups)**
   - Express, NestJS, Koa, Hapi, FastAPI, Django, Rails, Go (chi/gin/echo), tRPC routers, GraphQL servers (Apollo, Mercurius — note Mercurius is Fastify-native)

   **ORM / schema**
   - Prisma (`schema.prisma`), Drizzle (`schema.ts`, `drizzle.config.ts`), Kysely, TypeORM, MikroORM, raw SQL with `postgres`/`pg`
   - Migrations directory and how migrations are run (Prisma Migrate, Drizzle Kit, custom)

   **Datastores**
   - Postgres (most common with Fastify), MySQL, SQLite, MongoDB, Redis (`@fastify/redis` or ioredis directly), DynamoDB
   - Connection pool config — Fastify benefits a lot from sized pools tied to plugin lifetime

   **Async / jobs**
   - BullMQ (often paired with Fastify via Redis), Inngest, Trigger.dev, Temporal, raw cron, webhook receivers

   **Caching**
   - Redis, in-memory (`@fastify/caching`, `lru-cache`), HTTP cache headers, edge cache

   **Deployment / runtime**
   - `Dockerfile`, `docker-compose.yml`, `fly.toml`, `railway.toml`, `render.yaml`, Kubernetes manifests
   - Serverless adapters: `@fastify/aws-lambda`, `@fastify/serverless` — note Fastify is happier as a long-running process than as a per-request lambda

   **Observability**
   - Pino transports (`pino-pretty` in dev, `pino-loki`/`pino-datadog` in prod), `@fastify/under-pressure` for load shedding, OpenTelemetry instrumentation (`@opentelemetry/instrumentation-fastify`), Sentry (`@sentry/node` with Fastify integration), healthcheck routes

   **Config / secrets**
   - `@fastify/env` with JSON Schema validation, `dotenv`, secret managers, feature flag clients
   - If a frontend brief or IA exists at `.design/<slug>/DESIGN_BRIEF.md` or `INFORMATION_ARCHITECTURE.md`, read it. The data model and routes must serve those flows.
   - Treat what exists as the starting vocabulary. Extend, don't replace.

3. Interview the user on each unresolved area below. Ask one question at a time. For each, propose a recommended answer and explain the tradeoff so the user can push back. Skip any area the codebase scan answered definitively.

   **Data model**
   - What are the core entities and how do they relate?
   - Which fields are required vs. optional? Which are derived?
   - What are the natural unique constraints and indexes?
   - What is the expected row count per entity in 1 month, 1 year?
   - Soft delete vs. hard delete? Audit trail needed?

   **Auth model**
   - Who calls this? (end users, internal services, third-party integrations)
   - Authentication: sessions, JWT, API keys, OAuth, mTLS?
   - Authorization: role-based, attribute-based, resource-scoped, multi-tenant isolation?
   - What is the blast radius if a credential leaks?

   **Fastify shape (skip if not Fastify)**
   - Plugin boundaries: which concerns are isolated plugins (auth, db, business domain) vs. flat in the root scope?
   - Schema strategy: raw JSON Schema, TypeBox, or Zod via `fastify-type-provider-zod`? Pick one and stick to it — mixing is painful.
   - Where does validation happen: route schema (preferred — Fastify compiles it), `preValidation` hook, or downstream service?
   - Decorators planned for cross-cutting state: `request.user`, `request.tenantId`, `fastify.db`, `fastify.cache`?
   - Error handling: one global `setErrorHandler` mapping to RFC 7807 problem details, or per-plugin error handlers?
   - Logger: keep Pino default, or wire a transport (loki, datadog, otel)? What gets redacted?

   **Scale & latency targets**
   - p50 / p95 / p99 latency budget for the hot path?
   - Requests per second at launch, in 6 months, at the ceiling we'd celebrate?
   - Read-heavy, write-heavy, or balanced?
   - Geographic distribution of callers?

   **Consistency requirements**
   - Strong consistency, read-your-writes, or eventual consistency acceptable?
   - Where are transactions required? Where can we tolerate retries / idempotency keys instead?
   - Any operations that must be exactly-once vs. at-least-once?

   **Deployment target**
   - Serverless, long-running container, edge runtime, or VM?
   - One region or multi-region? Cold-start tolerance?
   - How are migrations applied? Zero-downtime requirements?
   - Blue/green, canary, or rolling deploys?

   **Observability**
   - What signals tell us this is healthy? (latency, error rate, queue depth, business metrics)
   - What gets logged at info vs. error? Any PII redaction needed?
   - Tracing across services? Sampling rate?
   - Alerts: who gets paged, on what threshold?

4. Once you have a complete picture, write the brief using the template below.

## File Output

Save the brief to `.design/<feature-slug>/BACKEND_DESIGN.md`, using the same `<feature-slug>` as any existing frontend brief in `.design/`. If no `.design/` folder exists yet, create one and pick a slug derived from the feature name (e.g., `notifications-service`, `checkout-api`, `video-processor`).

If a `DESIGN_BRIEF.md` already exists in the chosen subfolder, cross-reference it: the data model and API should serve the flows and components named there.

Example:

```
.design/
└── checkout-api/
    ├── DESIGN_BRIEF.md       (if frontend brief exists)
    └── BACKEND_DESIGN.md     ← this skill produces this
```

## Brief Template

```markdown
# Backend Design: [Service / Feature Name]

## Problem

What this backend exists to do, framed by the calling context (which frontends, jobs, or external systems depend on it and why). Not implementation detail — purpose.

## Solution Sketch

The shape of the solution in plain terms: what kind of system this is (CRUD API, event processor, job runner, gateway), and the one or two architectural choices that define it.

## Callers & Consumers

| Caller            | Pattern              | Auth method | Notes |
| ----------------- | -------------------- | ----------- | ----- |
| [frontend / svc]  | [request/response, webhook, subscribe] | [session, JWT, API key] | [rate, criticality] |

## Data Model

### Entities

For each entity: fields, types, required/optional, indexes, relationships.

```
EntityName
├── id              [pk, type]
├── field_a         [type, required, indexed]
├── field_b         [type, optional]
└── relations       [foreign keys / joins]
```

### Invariants

Business rules the schema must enforce (uniqueness, referential integrity, state machines, allowed transitions). Note which are enforced at the DB layer vs. application layer and why.

### Growth & Retention

Expected size per entity at 1 month, 1 year. Retention policy (keep forever, archive after N, hard delete after N).

## API Surface

| Method | Path | Purpose | Auth | Idempotent? |
| ------ | ---- | ------- | ---- | ----------- |
| GET    | /... | ...     | ...  | yes         |
| POST   | /... | ...     | ...  | no (use idempotency key) |

For non-trivial endpoints, sketch request/response shape inline.

## Fastify Architecture (if applicable)

- **Plugin tree**: how the app is decomposed into plugins and which use `fastify-plugin` to escape encapsulation.
- **Schema/validation**: chosen strategy (JSON Schema / TypeBox / Zod) and where it lives.
- **Decorators**: cross-cutting state attached to `fastify`, `request`, `reply`.
- **Hooks**: which lifecycle hooks are used and for what (auth in `preHandler`, audit in `onResponse`, etc.).
- **Error handling**: shape of the error response, where `setErrorHandler` lives.
- **Logger**: Pino config, transports per environment, redaction list.

## Auth Model

- **Authentication**: [mechanism — sessions/JWT/API keys/OAuth/mTLS, where credentials live, rotation policy]
- **Authorization**: [model — RBAC/ABAC/resource-scoped, who can do what]
- **Tenancy**: [single-tenant, multi-tenant with row-level isolation, multi-tenant with separate DBs]
- **Threat model notes**: [what we worry about — credential leak, replay, IDOR, enumeration]

## Scale & Latency Targets

| Metric           | Target            | Notes |
| ---------------- | ----------------- | ----- |
| p50 latency      | [ms]              | [hot path / cold path] |
| p95 latency      | [ms]              |       |
| p99 latency      | [ms]              |       |
| RPS at launch    | [n]               |       |
| RPS ceiling      | [n]               |       |
| Read:write ratio | [e.g. 90:10]      |       |

## Consistency Model

What guarantees we promise and where. Call out:
- Operations that need ACID transactions
- Operations safe under eventual consistency
- Idempotency strategy for retried writes (idempotency keys, dedup tables, natural keys)
- Exactly-once vs. at-least-once expectations for async work

## Deployment

- **Runtime**: [serverless / long-running container / edge / VM]
- **Region(s)**: [one / multi, primary, failover]
- **Migrations**: [tool, when applied, zero-downtime requirements, backfill strategy]
- **Rollout**: [blue/green, canary %, rolling, manual]
- **Rollback**: [how, how fast]

## Observability

- **Logs**: [what gets logged, levels, format, PII handling]
- **Metrics**: [the handful that matter — latency, error rate, queue depth, business KPIs]
- **Traces**: [tooling, sampling rate, propagation across services]
- **Alerts**: [signal → threshold → who gets paged]
- **Healthcheck**: [endpoint, what it actually checks]

## Failure Modes

The top 3-5 ways this can go wrong and the chosen response: retry, fail loud, degrade gracefully, queue for later.

| Failure                  | Response                        |
| ------------------------ | ------------------------------- |
| [downstream times out]   | [retry with backoff, then ...]  |
| [DB unavailable]         | [...]                           |

## Out of Scope

Explicit non-goals. Things this brief does not cover so the build stays bounded.

## Open Questions

Anything still unresolved that needs a decision before or during the build.
```
