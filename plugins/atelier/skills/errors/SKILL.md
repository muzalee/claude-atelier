---
name: errors
description: Design and throw errors that self-explain, so debugging from a log line is possible without rerunning the code. Every error carries a stable code, a human message, the cause chain, and (for API errors) an HTTP status. Distinguishes expected errors (validation, auth, not-found) from unexpected (bugs, infra down). Pairs with the `logging` skill — errors get logged with full context by the global handler. Use when adding a new error type, refactoring error handling, deciding whether to throw / return / wrap, writing an API route, or reviewing code for error discipline. Do not build a taxonomy for one endpoint — YAGNI applies.
---

The point of an error is to make debugging cheap. If reading the log line doesn't tell you what happened, what was expected, and where to look — the error failed at its job. This skill covers how to design and throw errors that carry that information every time.

Pairs with `logging` — errors get emitted through the global handler that adds request context, trace-id, and the full cause chain. Neither skill works without the other.

## Example prompts

- "Add error handling for the user-lookup route"
- "Refactor these `throw new Error('X')` calls to something typed"
- "What should the error shape look like for this API?"
- "Review this handler for error discipline"

## Core principles

1. **Every error self-explains.** From the log line alone, a reader should know: *what* happened, *what was expected*, and *where* to look next. `Error("not found")` fails this test. `NotFoundError("user", { id })` passes.

2. **Codes over stack traces for categorization.** A stable string code (e.g. `USER_NOT_FOUND`, `TOKEN_EXPIRED`, `RATE_LIMITED`) is greppable, dashboard-friendly, and stable across refactors. Stack traces are for one-off debugging, codes are for aggregation.

3. **Distinguish expected from unexpected.**
   - **Expected** (validation, auth, not-found, conflict, rate-limit) — a normal outcome, log at WARN or INFO, return a clean response to the caller.
   - **Unexpected** (a null dereference, downstream 500, DB unreachable) — a bug or infra failure, log at ERROR, do not leak details to the caller (return generic `500`).

4. **Throw at the boundary where the invariant breaks.** If the DB says the row doesn't exist, throw there — not three call sites up. Callers should catch only when they can *do* something (retry, fallback, transform).

5. **Never rethrow bare.** `catch (e) { throw e }` is dead weight — remove it. If you catch, either **enrich** (`throw new ServiceError("user lookup failed", { cause: e, code: "USER_LOOKUP" })`) or **handle** (fallback, log-and-swallow with justification). Never swallow silently.

6. **HTTP status maps from error type, not per-endpoint.** A `NotFoundError` becomes 404 everywhere. A `ValidationError` becomes 400. Wire the mapping once in the global handler, not in every route.

## The shape of an error

Whatever your language, an error carries these fields:

| Field    | Purpose                                                                  |
| :------- | :----------------------------------------------------------------------- |
| `type`   | Class / typed error variant. `NotFoundError`, `ValidationError`, etc.    |
| `code`   | Stable string, `SCREAMING_SNAKE`. Grep-friendly, dashboard-friendly.     |
| `message`| Human-readable, actionable. "User `abc123` not found in projects table." |
| `cause`  | The wrapped underlying error (chain), so the log has the full trail.     |
| `status` | HTTP status code (for API errors only). Used by the global handler.      |
| `context`| Any structured fields relevant to reproducing (ids, params). No secrets. |

TypeScript example (adapt to your stack):

```ts
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly context: Record<string, unknown> = {},
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context: Record<string, unknown>) {
    super(`${resource} not found`, `${resource.toUpperCase()}_NOT_FOUND`, 404, context);
  }
}
```

Throw:

```ts
const user = await db.users.byId(id);
if (!user) throw new NotFoundError("user", { id });
```

## Global error handler — the contract

Wire once. Every thrown error routes through here.

**Responsibilities:**

1. **Log the full error.** Message + code + status + context + cause chain (walk `.cause` recursively). This is where the `logging` skill's structure kicks in — see that skill for the shape.
2. **Map to HTTP response.** Use `error.status` if it's an `AppError`; default to 500 otherwise.
3. **Never leak internals on 500.** Response body is `{ code: "INTERNAL", message: "internal error", trace_id }`. The dev sees the real error in logs via `trace_id`.
4. **Preserve trace-id.** Attach the request's trace-id to the response so users can quote it in support tickets.

Fastify example:

```ts
fastify.setErrorHandler((err, req, reply) => {
  const isApp = err instanceof AppError;
  req.log.error({
    err,
    code: isApp ? err.code : "INTERNAL",
    context: isApp ? err.context : {},
    trace_id: req.id,
  }, "request failed");

  const status = isApp ? err.status : 500;
  reply.code(status).send({
    code: isApp ? err.code : "INTERNAL",
    message: isApp ? err.message : "internal error",
    trace_id: req.id,
  });
});
```

## When to throw vs return

- **Throw** for exceptional conditions the current function cannot handle. Bad input at a validated boundary, missing entity in a lookup, downstream 500, etc.
- **Return** for expected results, including "not found" from a *search* (returning `null` or `[]` is fine — an empty search is a valid outcome). Returning is cheaper than throwing and doesn't need a `catch`.
- **Never** throw for control flow. `throw new Error("break loop")` is a code smell.

Rule of thumb: if the caller would immediately need to catch and translate, you should have returned instead.

## Ponytail: don't overbuild the taxonomy

Two thousand error classes for a CRUD service is over-engineering. Start with a handful:

- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `RateLimitError` (429)
- `AppError` (500 — the generic fallback for typed internal errors)

Add a specialized class only when you have three callers who need the *same* recovery logic. Before three, `throw new ValidationError('bad email', { field: 'email' })` is fine.

## Anti-patterns

- **`throw new Error(String(e))`** — loses the cause chain. Use `throw new WrapperError(msg, { cause: e })` or don't wrap at all.
- **`catch (e) { console.error(e); throw e; }`** — the global handler logs. This is just noise + duplicate log entries.
- **`catch (e) {}`** — silent swallow. If you *must*, comment why (`// ponytail: swallow — this is a fire-and-forget cache miss`).
- **`throw "user not found"`** — throwing a string, not an Error. Loses stack, loses cause. Never do this.
- **HTTP status decided in the route** — should live on the error type. Route just `throw`s.
- **Leaking DB error messages to the client** — never send `duplicate key value violates unique constraint` back over HTTP. Wrap in a domain error.

## Reviewing for error discipline

When reviewing (or when `code-review` runs), check for:

- Every `throw` uses a typed error, not `new Error(...)` (or the language's equivalent).
- Every `catch` either enriches or handles — never bare rethrow, never silent swallow.
- The error path is tested (see `test-plan` — "failure modes" is where these cases live).
- HTTP responses on 500 don't leak internals.
- Log lines for errors include code + trace-id + context (see `logging`).

## The story with logging

An error's job is to *capture* what went wrong. Logging's job is to *emit* it. The story:

1. Bad input → `throw new ValidationError('email required', { field: 'email' })` at the validation layer.
2. Global handler catches → logs `{ level: error, code: EMAIL_REQUIRED, trace_id: abc123, user_id: u_42, context: { field: email } }` via the `logging` skill's structure.
3. Handler responds `400 { code: EMAIL_REQUIRED, message: "email required", trace_id: abc123 }`.
4. Operator sees the log, greps the codebase for `EMAIL_REQUIRED` → finds where it's thrown → uses `trace_id` to find related logs from the same request → reproduces.

If any step lacks context, debugging costs a rerun. That's the point of the discipline.
