---
name: backend-design
description: Create a backend design through an interactive interview, codebase exploration, and decisions about data model, auth, invariants and failure modes. Biased toward Fastify (Node) but works for any backend stack. Fills the `## Architecture` section of the feature's `.design/YYYY-MM-DD-<slug>.md`. Use when user wants to plan a backend, design an API, define a data model, mention "backend brief", or pair with a frontend design brief.
---

This skill designs the server side through structured conversation. It is the counterpart to `design-brief`, and it fills one section — `## Architecture` — of the feature's `.design/YYYY-MM-DD-<slug>.md`. Skip any question the codebase already answers — read first, then ask only what is unresolved.

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
   - If the feature already has a design file, read it — find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). The data model and routes must serve the flows named there.
   - Treat what exists as the starting vocabulary. Extend, don't replace.

3. Interview the user on each unresolved area below. Ask one question at a time. For each, propose a recommended answer and explain the tradeoff so the user can push back. Skip any area the codebase scan answered definitively.

   **On an existing backend, most of the last four areas are already answered.** Scale, consistency, deployment and observability are decisions a running service made long ago; ask about them only where *this feature* changes them — a new table with a retention question, a write that needs a transaction, a migration that cannot take downtime. Asking a user to restate their deploy pipeline because you are adding an endpoint is how an interview loses its credibility.

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

4. Once you have a complete picture, write the `## Architecture` section using the guidance below.

## File Output

Fill the `## Architecture` section of the feature's `.design/YYYY-MM-DD-<feature-slug>.md`.

**Find the file before you make one.** Find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). The frontend brief usually got here first and already created it.

In a legacy six-file folder, keep writing to `BACKEND_DESIGN.md` beside the other old files.

**Only when nothing matches** do you create the file yourself, as `.design/YYYY-MM-DD-<feature-slug>.md` — the date read from the environment (`date +%F`), never guessed — with a slug derived from the feature name (e.g., `notifications-service`, `checkout-api`, `video-processor`). That date is then frozen for the life of the file. Write the full set of headings in order, and fill `## Architecture`.

Read the sections already written — `## Problem`, `## Solution`, `## Scope`, `## Experience` — before you write. The data model and API must serve the flows and components named there.

## What to write in `## Architecture`

**Write what this feature actually touches, and nothing else.** The menu below is what a *new service* needs. A feature on an existing backend needs the first four items and usually collapses the rest to one line or drops them entirely — the deployment story, the observability story and the scale targets did not change because you added an endpoint. Say so in a line if it is worth saying; say nothing if it is not.

Never leave a placeholder table. A two-row API table is a design; a two-row API table plus six `| [type] | ... |` rows is a form nobody filled.

```markdown
## Architecture

**Shape**: what kind of system this is (CRUD API, event processor, job runner, gateway) and the one or two architectural choices that define it. On an existing backend: which plugin/module this lands in.

**Callers**: who calls this, how (request/response, webhook, subscribe), and with what auth. Skip when it is only the frontend already named in `## Experience`.

**Data model**: the entities this feature adds or changes — fields, types, required/optional, indexes, relationships. Only the delta; the rest of the schema is in the repo.

**Invariants**: the business rules the schema must enforce — uniqueness, referential integrity, state machines, allowed transitions. Note which are enforced at the DB layer vs. the application layer and why.

**API surface**: method, path, purpose, auth, idempotency. Sketch request/response shape inline for the non-trivial ones.

**Auth**: authentication mechanism, authorization model, tenancy, and what the threat model worries about here — credential leak, replay, IDOR, enumeration. On an existing backend this is usually one line: which existing guard the routes sit behind.

**Failure modes**: the top 3-5 ways this goes wrong and the chosen response — retry, fail loud, degrade, queue for later. These become integration cases in `## Tests`, so name them.

**Growth / consistency / deployment / observability**: only when this feature changes them. A new table with a retention policy, a write that needs a transaction, a migration with a zero-downtime requirement, a new signal worth alerting on. Nothing to say means these do not appear.
```

## Done when

- `## Architecture` in `.design/YYYY-MM-DD-<slug>.md` is filled, or says in one line why there is no server work
- Entities, API surface, and auth model are concrete enough to implement without asking again
- Nothing in the section is a placeholder, and nothing restates a decision `## Experience` already made
- Every open question has an owner and a by-when, or it is not open, it is undecided — carry unresolved ones into `## Tasks` rather than leaving a dangling list

**Then hand off.** Say: "Architecture written to `.design/YYYY-MM-DD-<slug>.md`." Then: "Next: **`/atelier:information-architecture`** to map structure and flows against this API surface." 
