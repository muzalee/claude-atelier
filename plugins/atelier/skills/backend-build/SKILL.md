---
name: backend-build
description: Implement the backend from a BACKEND_DESIGN.md brief — set up plugins, database, routes, tests, and wire everything into the server entry. Biased toward Fastify + Node. Use when user says "build the backend", "implement the server", "code the API from the brief", or after running /backend-design.
---

Turn a `BACKEND_DESIGN.md` brief into a working backend. Read the brief first, follow its decisions, don't invent architecture the brief didn't decide.

## Example prompts

- "Build the backend from the brief"
- "Implement the notifications service"
- "Code the API defined in BACKEND_DESIGN.md"
- "Start building the server for checkout"

## Prerequisites

- A `BACKEND_DESIGN.md` file at `.design/<feature-slug>/` (produced by `/backend-design`).
- If none exists, stop and tell the user to run `/backend-design` first — this skill needs a brief, not a vibe.

## Process

1. **Read the brief in full.** Note every decision the brief locked in:
   - Stack (Fastify vs other), schema strategy (JSON Schema / TypeBox / Zod), ORM, datastore
   - Plugin boundaries, decorators, hooks
   - Auth model, error shape, logger config
   - Every route in the API surface table
   - Deployment target, migrations strategy

2. **Scan the codebase.** If this is an existing project, do NOT restart from scratch. Extend what's there. Check:
   - `package.json` for existing deps
   - Existing plugin tree, route files, decorator definitions
   - Existing DB connection, migration setup, test framework
   - `.env` / `env.example` for existing config keys

3. **Confirm the build plan** before writing code. State back:
   - Files you'll create / modify (as a short list)
   - New dependencies needed (and why)
   - Migration(s) that will be generated
   - Build order (foundations → auth → routes → tests)
   
   Wait for confirmation.

4. **Build in this order** (skip any step already handled by the codebase):
   1. **Server entry** — Fastify instance, logger config, `setErrorHandler`, `setNotFoundHandler`, graceful shutdown, `listen`.
   2. **Config plugin** — `@fastify/env` with JSON Schema validation of every env var the brief names.
   3. **Database plugin** — connection, pool config, decorator (`fastify.db`), close on shutdown.
   4. **Auth plugin** — the mechanism from the brief (JWT / session / API key). Decorators for `request.user`, `fastify.authenticate` preHandler.
   5. **Migrations / schema** — generate the schema matching the entities in the brief. One migration per entity or logical group.
   6. **Routes** — one plugin per domain. For each route in the API table, delegate to the `fastify-route` skill's shape: `schema:` with body/params/querystring/response, thin handler, service function underneath for business logic.
   7. **Tests** — one test file per route plugin. Cover happy path + one validation failure + one auth failure. Match the test framework already in the project (or `node:test` / `vitest` if greenfield).
   8. **Observability wiring** — Pino config per environment, healthcheck route, any transport the brief calls out.

5. **Run the checks** at the end:
   - `npm run build` (or `tsc --noEmit`) — must pass
   - `npm test` — must pass
   - Start the server locally and hit the healthcheck once — must return 200

6. **Summarize** in ~5 lines: files created, migrations added, tests passing, server started successfully. Point at anything the brief said to do that you deferred (and why).

## Rules

- **The brief is the source of truth.** If a decision isn't in the brief, either infer from the codebase or ask. Don't invent.
- **One schema library.** Never mix JSON Schema, TypeBox, and Zod in the same project.
- **Thin handlers, fat services.** Route handlers stay under ~20 lines. Business logic goes in `src/services/<domain>.ts`.
- **Every route gets a schema.** No untyped `request.body`. If the brief says an endpoint takes `{ email }`, that's a schema, not a comment.
- **Errors: throw, don't return.** The global `setErrorHandler` shapes the response.
- **Follow `keep-it-simple`** for commit messages and any inline docs written along the way.
- **Don't add anything the brief didn't ask for** — no rate limiting, CORS, Swagger UI, admin panel, etc. unless the brief names it.

## Anti-patterns

- Rewriting the plugin tree the codebase already has just because "the brief's structure looks different." Extend, don't replace.
- Writing a giant `index.ts` with all routes inline. The brief specifies plugin boundaries — respect them.
- Adding `try/catch` around every route body to log errors. Fastify's request logger and `setErrorHandler` already cover this.
- Generating a full Prisma schema when the brief only needs three tables. Match scope.
- Skipping tests because "the brief didn't explicitly ask for them." Every route gets at least one test.

## When to stop and ask

- The brief conflicts with the existing codebase (e.g. brief says JWT, codebase uses sessions). Ask which wins.
- The brief calls for a service that isn't available in this environment (e.g. Redis not installed). Ask for the fallback.
- A "simple" migration would be destructive on existing data. Ask before running.
