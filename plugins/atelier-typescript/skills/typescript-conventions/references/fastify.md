# Fastify / Node conventions

Assumes the shared rules in `../SKILL.md`. Match the existing codebase over anything here.

## Contents

- [Plugins and encapsulation](#plugins-and-encapsulation)
- [Schemas and validation](#schemas-and-validation)
- [Routes and handlers](#routes-and-handlers)
- [Decorators](#decorators)
- [Errors](#errors)
- [Logging](#logging)
- [Database](#database)
- [Lifecycle and shutdown](#lifecycle-and-shutdown)
- [Testing](#testing)
- [Anti-patterns](#anti-patterns)

## Plugins and encapsulation

Fastify's encapsulation is the architecture, not a detail. Every `register` creates a child scope: decorators, hooks, and plugins added inside it are invisible outside. That is how one domain's auth hook stops applying to another domain's routes without anyone writing a path check.

**`fastify-plugin` (`fp`) breaks encapsulation deliberately** — it hoists the plugin's additions into the parent scope. Use it for genuinely cross-cutting infrastructure that everything needs: the database handle, the logger config, the auth decorator. Do **not** use it for a domain plugin. Wrapping everything in `fp` flattens the app into one global scope and throws away the property that made the structure worth having.

Shape that holds up — the encapsulation boundaries and the folders are the same lines:

```
src/
├── app.ts                 # builds the instance, registers plugins in order
├── server.ts              # listen + graceful shutdown, nothing else
├── plugins/               # fp-wrapped infrastructure, shared by everything:
│   ├── db.ts              #   db handle, auth decorator, config, cors
│   └── auth.ts
└── modules/<domain>/      # one domain per folder, each an encapsulated plugin
    ├── routes.ts          # plain plugin (NOT fp) — its hooks stay inside
    ├── service.ts         # business logic, no Fastify types, unit-testable
    └── schema.ts          # request/response schemas for this domain
```

**Dependencies run one way: `plugins/` → `modules/`.** Infrastructure knows nothing about a domain; a domain may use any plugin. A module importing from a sibling module means the shared piece belongs in `plugins/` or in its own module — the same rule the frontend applies to features, for the same reason.

Keep `server.ts` free of application logic. An `app.ts` that returns a configured instance without listening is what makes integration tests possible — they build an app and call `inject`, no port, no teardown race.

## Schemas and validation

**Declare the schema in the route's `schema` option, never validate inside the handler.** Fastify compiles it once with Ajv, which is faster than anything hand-written, and it produces the OpenAPI spec for free if `@fastify/swagger` is registered.

**The response schema is not optional, and it is not documentation.** Fastify uses it to serialize, and it drops any field not declared — which is exactly what stops an internal column, a password hash, or a raw error leaking out when someone adds a field to a database model. A route without a response schema leaks by default.

**One type provider, chosen once.** TypeBox (`@fastify/type-provider-typebox`) or Zod (`fastify-type-provider-zod`) both give you a single source of truth for the runtime schema and the static type. Whichever the project has, use it; never add the second.

```ts
fastify.post('/users', {
  schema: {
    body: CreateUserBody,
    response: { 201: UserResponse, 409: ErrorResponse },
  },
}, async (request, reply) => {
  const user = await createUser(request.body)   // body is typed, already validated
  return reply.code(201).send(user)
})
```

## Routes and handlers

**Handlers stay thin.** Parse, call a service, shape the reply. Business logic lives in a service function that takes plain arguments and knows nothing about `request` or `reply` — which is what makes it unit-testable without constructing a fake request.

**Pick one reply style and keep it.** Either `return payload` or `reply.send(payload)`, not both in one codebase. Mixing them is how someone eventually returns a value *and* calls send, and Fastify warns about a reply already sent.

`async` handlers must not call `reply.send()` and also return a value. If a handler is `async`, return the payload; use `reply` only to set a status code or headers.

**Auth goes in a hook, not in the handler.** `onRequest` or `preHandler`, registered on the encapsulated scope that needs it. An auth check written inside a handler is one a new route silently forgets.

Order matters and it is the ordinary source of confusion: `onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`. Authentication belongs in `onRequest` (cheapest, before the body is parsed); authorization that needs the parsed body belongs in `preHandler`.

## Decorators

`fastify.decorate`, `decorateRequest`, `decorateReply` attach cross-cutting state: `fastify.db`, `fastify.config`, `request.user`, `request.tenantId`.

Declare the types via module augmentation, once, next to the plugin that adds them:

```ts
declare module 'fastify' {
  interface FastifyInstance { db: Database }
  interface FastifyRequest { user?: AuthenticatedUser }
}
```

**Decorate `request` with a value, not a getter that does work per access**, and never decorate it with a mutable object shared across requests — that is a cross-request data leak, the worst kind of bug in a server, because it only appears under concurrency and shows one user another user's data.

## Errors

Follow the `errors` skill. The Fastify-specific parts:

- **Throw, don't return.** One `setErrorHandler` at the root maps every error to the wire shape. Per-route error handling means every route gets it slightly differently.
- **The error shape is a contract.** Pick one — RFC 7807 problem details or a plain `{ error: { code, message } }` — and give it a response schema like any other payload.
- **Never let an unknown error's message reach the client.** Known application errors carry a safe message and a stable code; everything else becomes a 500 with a generic body and the real detail in the log, correlated by trace id.
- `@fastify/sensible` gives you `httpErrors.badRequest(...)` if the project already has it. Don't add it for one call site.

## Logging

Follow the `logging` skill. The Fastify-specific parts:

- **Use `request.log`, not the root logger,** inside anything request-scoped. It carries the request id, which is what makes a log line traceable back to a request.
- **Do not create a second logger.** Fastify's Pino instance is the logger. A separate `console.log` or a fresh Pino breaks correlation and skips redaction.
- **Configure redaction once** in the logger options — `authorization` headers, `cookie`, tokens, anything PII-shaped. Redaction you have to remember at each call site is redaction that gets forgotten.
- Fastify already logs method, path, status, and latency per request. Adding your own "request received" line duplicates it.

## Database

- **One connection pool, owned by a plugin,** decorated onto the instance and closed in that plugin's `onClose`. A pool created per module leaks connections and silently exhausts the server's limit.
- **Size the pool deliberately.** The default is rarely right, and a pool larger than the database's own connection limit fails under exactly the load you sized it for.
- **Transactions wrap multi-step writes**, and the transaction handle is passed explicitly to each call inside. A service that reaches for the global pool mid-transaction writes outside it, which is invisible until a rollback fails to roll something back.
- **Migrations are reversible and never destructive in one step.** Adding a column is safe; dropping one is a separate deploy after nothing reads it. Expand, migrate, contract.

## Lifecycle and shutdown

`server.ts` listens and shuts down cleanly:

- Handle `SIGTERM` and `SIGINT` — stop accepting connections, let in-flight requests finish, close the pool, then exit.
- `closeWithGrace` or `@fastify/graceful-shutdown` handle the sequencing; hand-rolling it usually forgets the timeout that stops a hung request from blocking the exit forever.
- Register cleanup as `onClose` hooks in the plugin that owns the resource, so teardown mirrors setup and nothing is forgotten in a central function.

Without this, every deploy drops live requests, and the errors land on users rather than in a log.

## Testing

**`fastify.inject()` over a live HTTP server.** It exercises the full stack — hooks, validation, serialization — with no port, no listen, no teardown race, and it runs in milliseconds.

Build the app with a factory (`buildApp(overrides)`) so a test can swap the database for a test instance without monkey-patching a module. Test against a real database where feasible; a mocked query builder asserts that you wrote the query you wrote, not that it returns what you expect.

Every route gets the happy path, one validation failure, and one auth failure if it is protected.

## Anti-patterns

- **`fastify-plugin` on everything.** Encapsulation gone; every hook is now global and applies to routes it was never meant to touch.
- **Validation inside the handler** when `schema` would have done it — slower, untyped, and missing from the OpenAPI spec.
- **A route with no response schema.** It serializes whatever the object happens to hold, today and after the next model change.
- **`try/catch` around a whole handler to log and rethrow.** The error handler already logs; this adds a duplicate line and a stack frame.
- **Business logic importing `FastifyRequest`.** The service now needs a fake request to test and cannot be called from a job or a CLI.
- **Awaiting `listen()` before the app is ready** — register everything, then listen; `ready()` surfaces plugin errors at boot rather than on the first request.
