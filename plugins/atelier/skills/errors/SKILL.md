---
name: errors
description: Design and throw errors that self-explain, so debugging from a log line is possible without rerunning the code. Every error carries a stable internal code, a precise internal message, a friendly user-facing message, a short public reference code, the cause chain, and (for API errors) an HTTP status. Distinguishes expected errors (validation, auth, not-found) from unexpected (bugs, infra down). Pairs with the `logging` skill — errors get logged with full context by the global handler. Use when adding a new error type, refactoring error handling, deciding whether to throw / return / wrap, writing an API route, or reviewing code for error discipline. Do not build a taxonomy for one endpoint — YAGNI applies.
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

4. **Two audiences, two messages.** The internal `message` is precise and for you — table names, ids, constraint names, whatever reproduces it. The `userMessage` is for the person staring at the screen: plain language, no jargon, and it says what they can do next. One field cannot serve both. A user should never read `duplicate key value violates unique constraint "users_email_key"`, and you should never debug from `Something went wrong.`

5. **Throw at the boundary where the invariant breaks.** If the DB says the row doesn't exist, throw there — not three call sites up. Callers should catch only when they can *do* something (retry, fallback, transform).

6. **Never rethrow bare.** `catch (e) { throw e }` is dead weight — remove it. If you catch, either **enrich** (`throw new ServiceError("user lookup failed", { cause: e, code: "USER_LOOKUP" })`) or **handle** (fallback, log-and-swallow with justification). Never swallow silently.

7. **HTTP status maps from error type, not per-endpoint.** A `NotFoundError` becomes 404 everywhere. A `ValidationError` becomes 400. Wire the mapping once in the global handler, not in every route.

## The shape of an error

Whatever your language, an error carries these fields:

| Field         | Audience | Purpose                                                                       |
| :------------ | :------- | :---------------------------------------------------------------------------- |
| `type`        | internal | Class / typed error variant. `NotFoundError`, `ValidationError`, etc.         |
| `code`        | internal | Stable string, `SCREAMING_SNAKE`. Grep-friendly, dashboard-friendly.          |
| `message`     | internal | Precise and technical. "user `abc123` not found in `projects.members`."       |
| `cause`       | internal | The wrapped underlying error (chain), so the log has the full trail.          |
| `context`     | internal | Any structured fields relevant to reproducing (ids, params). No secrets.      |
| `status`      | both     | HTTP status code (for API errors only). Used by the global handler.           |
| `ref`         | user     | Short public reference code, `A0001` style. Quotable in a support ticket.     |
| `userMessage` | user     | Plain language, no jargon, says what to do next. Safe to render verbatim.     |

The top block never crosses the boundary. The bottom block is what the HTTP response and the UI are allowed to show.

TypeScript example (adapt to your stack):

```ts
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly userMessage: string,
    readonly ref: string,
    readonly context: Record<string, unknown> = {},
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context: Record<string, unknown>) {
    super(
      `${resource} not found`,
      `${resource.toUpperCase()}_NOT_FOUND`,
      404,
      `We couldn't find that ${resource}. It may have been deleted.`,
      "R0404",
      context,
    );
  }
}
```

Throw:

```ts
const user = await db.users.byId(id);
if (!user) throw new NotFoundError("user", { id, tenant_id });
```

Five arguments is the ceiling before this wants an options object — take that turn when a sixth shows up.

## Public reference codes

`code` is for you: greppable, meaningful, changes shape as the codebase does. `ref` is for the user: short, stable forever, meaningless on its own. They are different jobs, so they are different fields — and `ref` is emphatically not the HTTP status, which only says *which shelf* the failure sits on.

The scheme: one letter for the domain, four digits.

| Prefix | Domain                          | Example                                     |
| :----- | :------------------------------ | :------------------------------------------ |
| `A`    | Auth — login, tokens, sessions  | `A0001` invalid credentials                 |
| `V`    | Validation — bad input          | `V0001` required field missing              |
| `R`    | Resource — not found, conflict  | `R0404` not found, `R0409` already exists   |
| `P`    | Payment / billing               | `P0001` card declined                       |
| `D`    | Data — DB unreachable, timeout  | `D0001` database unavailable                |
| `X`    | Internal — the catch-all bug    | `X0000` unexpected error                    |

Rules that keep it worth having:

- **A `ref` is never reused and never renamed.** Users quote them, support docs link them, screenshots outlive releases. Retire a code, leave the number burned.
- **One registry, one file.** `errors/registry.ts` (or equivalent) holds `ref → { code, status, userMessage }`. Adding an error means adding a row. Two places defining the same ref is how they drift.
- **Every `ref` has a `userMessage` written for a human, not derived from the code.** `A0001` is not "auth error" — it's "That email and password don't match. Try again or reset your password."
- **Unexpected errors all collapse to `X0000`.** You are not going to write friendly copy for a null dereference, and enumerating bugs is a losing game.

Keep a matching public page — a table of `ref` → what it means → what to do. That is the whole payoff: a user quotes `A0001`, support answers without a developer.

**Ponytail:** `ref` earns its keep when a support flow actually looks codes up. Before that, `trace_id` in the response is the quotable handle and `code` already categorizes for dashboards — skip `ref` and add it the day someone asks "what does the user read me over the phone?"

## Global error handler — the contract

Wire once. Every thrown error routes through here.

**Responsibilities:**

1. **Log the full error.** Internal message + code + ref + status + context + cause chain (walk `.cause` recursively). This is where the `logging` skill's structure kicks in — see that skill for the shape.
2. **Map to HTTP response.** Use `error.status` if it's an `AppError`; default to 500 otherwise.
3. **Send only the user block.** Response body is `{ ref, message: userMessage, trace_id }`. The internal `message`, `code`, `context`, and `cause` stay in the logs. Anything that isn't an `AppError` is a bug you haven't classified yet — it goes out as `X0000` with a generic line, never as `err.message`.
4. **Preserve trace-id.** Attach the request's trace-id to the response so users can quote it in support tickets. `ref` says *what kind*; `trace_id` says *which one*. Support needs both.

Fastify example:

```ts
fastify.setErrorHandler((err, req, reply) => {
  const isApp = err instanceof AppError;
  // expected errors are a normal outcome — don't page anyone for a 404
  const level = isApp && err.status < 500 ? "warn" : "error";
  req.log[level]({
    err,                                    // logger serializes message + stack + cause chain
    code: isApp ? err.code : "UNEXPECTED",
    ref: isApp ? err.ref : "X0000",
    context: isApp ? err.context : {},
    operation: req.routeOptions?.config?.operation,
  }, `${req.method} ${req.routeOptions?.url ?? req.url} failed`);

  reply.code(isApp ? err.status : 500).send({
    ref: isApp ? err.ref : "X0000",
    message: isApp ? err.userMessage : "Something went wrong on our end. Try again in a moment.",
    trace_id: req.id,
  });
});
```

## The trace-id, end to end

`ref` tells support *what kind* of failure. `trace_id` tells them *which one* — this user, this click, this second. Neither substitutes for the other, and the chain only works if every link exists:

1. **Generate at the edge.** The first service to see the request mints one, unless the caller already sent `x-request-id` or a W3C `traceparent` — then honor theirs. Fastify's `req.id` does this; most frameworks have an equivalent.
2. **Bind it to the request-scoped logger** so every log line carries it without anyone passing it around. See `logging`.
3. **Forward it on every outgoing call** — HTTP header, queue message attribute, job payload. A trace that stops at your service boundary is half a story.
4. **Return it in the response**, in the body and as a response header, on success as well as failure. Support asks for it on "the page was slow" too, not just on errors.
5. **Show it in the UI** next to the user-facing message, selectable and copyable. A trace-id nobody can read off the screen is a trace-id nobody will ever quote.

Step 5 is the one that gets skipped, and skipping it quietly wastes the other four.

## When to throw vs return

- **Throw** for exceptional conditions the current function cannot handle. Bad input at a validated boundary, missing entity in a lookup, downstream 500, etc.
- **Return** for expected results, including "not found" from a *search* (returning `null` or `[]` is fine — an empty search is a valid outcome). Returning is cheaper than throwing and doesn't need a `catch`.
- **Never** throw for control flow. `throw new Error("break loop")` is a code smell.

Rule of thumb: if the caller would immediately need to catch and translate, you should have returned instead.

## Ponytail: don't overbuild the taxonomy

Two thousand error classes for a CRUD service is over-engineering. Start with a handful:

| Class               | Status | `ref`   | `userMessage`                                                    |
| :------------------ | :----- | :------ | :--------------------------------------------------------------- |
| `ValidationError`   | 400    | `V0001` | "Check the highlighted fields and try again."                     |
| `UnauthorizedError` | 401    | `A0001` | "Sign in to continue."                                            |
| `ForbiddenError`    | 403    | `A0002` | "You don't have access to this."                                  |
| `NotFoundError`     | 404    | `R0404` | "We couldn't find that. It may have been deleted."                |
| `ConflictError`     | 409    | `R0409` | "That already exists. Pick a different name."                     |
| `RateLimitError`    | 429    | `A0003` | "Too many attempts. Wait a minute and try again."                 |
| `AppError`          | 500    | `X0000` | "Something went wrong on our end. Try again in a moment."         |

Add a specialized class only when you have three callers who need the *same* recovery logic. Before three, `throw new ValidationError('bad email', { field: 'email' })` is fine — a new `ref` row is cheap, a new class is not.

## Anti-patterns

- **`throw new Error(String(e))`** — loses the cause chain. Use `throw new WrapperError(msg, { cause: e })` or don't wrap at all.
- **`catch (e) { console.error(e); throw e; }`** — the global handler logs. This is just noise + duplicate log entries.
- **`catch (e) {}`** — silent swallow. If you *must*, comment why (`// ponytail: swallow — this is a fire-and-forget cache miss`).
- **`throw "user not found"`** — throwing a string, not an Error. Loses stack, loses cause. Never do this.
- **HTTP status decided in the route** — should live on the error type. Route just `throw`s.
- **Leaking DB error messages to the client** — never send `duplicate key value violates unique constraint` back over HTTP. Wrap in a domain error.
- **One message for both audiences** — either the user reads a stack-shaped string, or you debug from "Something went wrong." Both fail. Write the two separately.
- **A `userMessage` that says nothing** — "An error occurred", "Operation failed", "Invalid request". Say what happened and what to do: "That file is larger than the 10 MB limit."
- **Blaming the user for your bug** — a 500 is not "Invalid input". If the cause is unknown, say it's on you and give them the `ref` and `trace_id`.
- **Interpolating internals into `userMessage`** — no ids, no table names, no `cause.message`. If a value must appear, it's one the user typed.
- **Renumbering `ref` codes in a refactor** — they're printed in screenshots and support docs. Codes are permanent; the `code` beside them is what's free to change.

## Reviewing for error discipline

When reviewing (or when `code-review` runs), check for:

- Every `throw` uses a typed error, not `new Error(...)` (or the language's equivalent).
- Every `catch` either enriches or handles — never bare rethrow, never silent swallow.
- The error path is tested (see `test-plan` — "failure modes" is where these cases live).
- HTTP responses on 500 don't leak internals — body is `ref` + `userMessage` + `trace_id`, nothing else.
- Every user-facing error has a `userMessage` a non-engineer could act on, and a `ref` that exists in the registry.
- No `ref` was renumbered or reused.
- Log lines for errors include code + ref + trace-id + context (see `logging`).

## The story with logging

An error's job is to *capture* what went wrong. Logging's job is to *emit* it. The story:

1. Bad input → `throw new ValidationError('email required', { field: 'email' })` at the validation layer.
2. Global handler catches → logs `{ level: warn, code: EMAIL_REQUIRED, ref: V0001, trace_id: abc123, user_id: u_42, operation: user.create, context: { field: email } }` via the `logging` skill's structure.
3. Handler responds `400 { ref: "V0001", message: "Enter your email address.", trace_id: "abc123" }`.
4. User screenshots `V0001` into a support ticket. Support reads the public code table, answers without a developer — or escalates with the `trace_id`.
5. Operator filters logs by that `trace_id` → sees every sibling log from the request → greps `EMAIL_REQUIRED` → finds the throw site → reproduces from `context`.

If any step lacks context, debugging costs a rerun. That's the point of the discipline.
