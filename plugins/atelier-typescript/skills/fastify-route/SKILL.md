---
name: fastify-route
description: Scaffold a new Fastify route (or set of routes) that matches the existing project's conventions — plugin structure, schema strategy (JSON Schema / TypeBox / Zod), auth, error shape, and tests. Use when user wants to add an endpoint, add a route, expose an API, or mentions "new route" / "add endpoint" in a Fastify project.
---

Add a new Fastify route to an existing project. Match what's already there — do not introduce a second schema library, a second auth pattern, or a new file layout.

## Example prompts

- "Add a POST /users route"
- "Scaffold a route for uploading images"
- "New endpoint: GET /orders/:id"
- "Add an admin-only route to delete a project"

## Process

1. **Scan the project first.** Do not write code until you know:
   - **Server entry**: `src/server.ts`, `src/app.ts`, or similar. Note the plugin registration order.
   - **Route file layout**: is it `src/routes/<domain>.ts`, `src/modules/<domain>/routes.ts`, autoload with `@fastify/autoload`, or flat? Match it.
   - **Schema strategy**: raw JSON Schema, `@sinclair/typebox`, or `fastify-type-provider-zod`. Pick from what's already imported in `package.json`. Never introduce a second one.
   - **Auth pattern**: is there a `preHandler` hook, a `fastify.authenticate` decorator, `@fastify/jwt`, or session cookies? Reuse it.
   - **Error shape**: is there a `setErrorHandler`? What does an error response look like? Match it.
   - **Test framework**: `tap`, `vitest`, `jest`, `node:test`. Match it and mirror the closest existing route's test file.
   - **DB access**: is there a `fastify.db` decorator, a Prisma client import, Drizzle, raw `pg`? Reuse the same pattern.

2. **Confirm the shape** with the user before writing. State back:
   - Method + path
   - Request schema (body / params / querystring)
   - Response schema (success + error cases)
   - Auth requirement
   - Which existing plugins / decorators it will use

3. **Write the route** as a plugin function following project conventions:
   - One route per file, unless the project groups by domain.
   - Attach the schema in the `schema:` option — don't validate inside the handler.
   - Use existing decorators (`fastify.db`, `request.user`) rather than importing new deps.
   - Keep the handler thin — business logic goes in a service function, not in the handler.

4. **Write the test** in the same style as the nearest existing test:
   - Happy path
   - One validation-failure case
   - One auth-failure case (if the route is protected)
   - One not-found or conflict case if relevant

5. **Register the route.** If autoload is used, dropping the file in the right folder is enough. Otherwise, add the `fastify.register(...)` call in the same place other domain plugins are registered.

## Rules

- **No new dependencies without asking.** If the "right" way needs a package not in `package.json`, stop and ask.
- **No mixed schema libraries.** If the project uses TypeBox, don't write a Zod schema.
- **Return via `reply.code(...).send(...)` or just `return ...`** — pick whichever the existing routes use. Don't mix.
- **Errors: throw, don't return.** Fastify's `setErrorHandler` and the response schema handle serialization. Handlers should throw typed errors (or `httpErrors.badRequest(...)` if `@fastify/sensible` is installed).
- **Don't add logging inside the handler unless the existing routes do** — Fastify's request logger already covers method/path/latency.

## Anti-patterns

- Writing a giant fat handler that hits the DB, transforms data, and formats a response inline. Split into a service.
- Duplicating a schema in the handler when it's already declared in `schema:` — Fastify's compiled validator is the source of truth.
- Adding `try/catch` around the whole handler to log and re-throw. The error handler already logs.
