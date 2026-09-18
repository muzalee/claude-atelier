---
name: errors
description: Design errors that self-explain — stable code, internal and user messages, public ref code, cause chain, retryable flag, HTTP status. Use when adding an error type, fixing or reviewing error handling, deciding throw vs return vs wrap, or writing an API route — also in scripts, jobs, queue workers, CLIs, batch loops, and when maintaining a ref-code registry. YAGNI: no taxonomy for one endpoint.
---

The point of an error is to make debugging cheap. If reading the log line doesn't tell you what happened, what was expected, and where to look — the error failed at its job. This skill covers how to design and throw errors that carry that information every time.

Pairs with `logging` — errors get emitted through the global handler that adds request context, trace-id, and the full cause chain. The trace-id itself belongs to `logging`; this skill only carries it into the response.

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

6. **Say whether retrying is worth it.** A caller looking at a failure has one question the error should already answer: *would doing this again help?* Timeouts, 429s, 503s, lock contention and connection resets are `retryable: true` — the world might differ in a second. Validation, auth, not-found and conflict are `retryable: false` — the input is wrong and will still be wrong on attempt five. Without the flag every call site guesses, and the guesses disagree: one gives up on a blip, another hammers a downstream that is 400ing. Put it on the error type once.

7. **Never rethrow bare.** `catch (e) { throw e }` is dead weight — remove it. If you catch, either **enrich** (`throw new ServiceError("user lookup failed", { cause: e, code: "USER_LOOKUP" })`) or **handle** (fallback, log-and-swallow with justification). Never swallow silently.

8. **HTTP status maps from error type, not per-endpoint.** A `NotFoundError` becomes 404 everywhere. A `ValidationError` becomes 400. Wire the mapping once in the global handler, not in every route.

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
| `retryable`   | internal | Whether trying again could plausibly work. Decides retry vs dead-letter.       |
| `ref`         | user     | Short public reference code, `A0001` style. Quotable in a support ticket.     |
| `userMessage` | user     | Plain language, no jargon, says what to do next. Safe to render verbatim.     |

The top block never crosses the boundary. The bottom block is what the HTTP response and the UI are allowed to show.

TypeScript example (adapt to your stack):

```ts
// REGISTRY holds ref -> { code, status, retryable, userMessage }; see "Public reference codes"
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly userMessage: string;

  constructor(
    message: string,                                  // internal, precise, logs only
    readonly ref: Ref,
    readonly context: Record<string, unknown> = {},
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = this.constructor.name;
    Object.assign(this, REGISTRY[ref]);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context: Record<string, unknown>) {
    super(`${resource} not found`, "R0404", { resource, ...context });
  }
}
```

Throw:

```ts
const user = await db.users.byId(id);
if (!user) throw new NotFoundError("user", { id, tenant_id });
```

The throw site supplies only what it actually knows — what broke and the values to reproduce it. Everything else (status, retryability, the words a user reads) is a property of the *kind* of failure, so it lives in the registry and stays consistent across every site that throws it.

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
- **One registry, one file.** `errors/registry.ts` (or equivalent) holds `ref → { code, status, retryable, userMessage }`. Adding an error means adding a row. Two places defining the same ref is how they drift.

  ```ts
  export const REGISTRY = {
    A0001: { code: "INVALID_CREDENTIALS", status: 401, retryable: false,
             userMessage: "That email and password don't match. Try again or reset your password." },
    V0001: { code: "FIELD_REQUIRED",      status: 400, retryable: false,
             userMessage: "Check the highlighted fields and try again." },
    R0404: { code: "NOT_FOUND",           status: 404, retryable: false,
             userMessage: "We couldn't find that. It may have been deleted." },
    D0001: { code: "DB_UNAVAILABLE",      status: 503, retryable: true,
             userMessage: "We're having trouble reaching our systems. Try again in a moment." },
    X0000: { code: "UNEXPECTED",          status: 500, retryable: false,
             userMessage: "Something went wrong on our end. Try again in a moment." },
  } as const;

  export type Ref = keyof typeof REGISTRY;
  ```

  Errors take a `Ref` and read the rest from the table, so a typo is a compile error and every row is visible in one screen. That is the whole mechanism — resist making it clever.
- **Every `ref` has a `userMessage` written for a human, not derived from the code.** `A0001` is not "auth error" — it's "That email and password don't match. Try again or reset your password."
- **Unexpected errors all collapse to `X0000`.** You are not going to write friendly copy for a null dereference, and enumerating bugs is a losing game.

Keep a matching public page — a table of `ref` → what it means → what to do. That is the whole payoff: a user quotes `A0001`, support answers without a developer.

**If you ship in more than one language**, the registry is already the right shape for it: `ref` is a stable key, `userMessage` is the value that varies. Make the value a translation key (`errors.A0001`) rather than a literal, and the table becomes your message catalogue — every user-facing string in one file, translatable without touching a throw site. Do this on the day a second language is real, not before: a catalogue with one locale in it is just a literal with extra steps. `code` and `ref` never translate.

**Ponytail:** `ref` earns its keep when a support flow actually looks codes up. Before that, `trace_id` in the response is the quotable handle and `code` already categorizes for dashboards — skip `ref` and add it the day someone asks "what does the user read me over the phone?"

## Global error handler — the contract

One per entry point, wired once each — the HTTP handler below, and its equivalent for every other surface (see [Outside HTTP](#outside-http)). Every error that escapes your code reaches exactly one of them. The contract is the same at each; only the last step differs.

**Responsibilities:**

1. **Log the full error.** Internal message + code + ref + status + context + cause chain (walk `.cause` recursively). This is where the `logging` skill's structure kicks in — see that skill for the shape.
2. **Map to HTTP response.** Use `error.status` if it's an `AppError`; default to 500 otherwise.
3. **Send only the user block.** Response body is `{ ref, message: userMessage, trace_id }`. The internal `message`, `code`, `context`, and `cause` stay in the logs. Anything that isn't an `AppError` is a bug you haven't classified yet — it goes out as `X0000` with a generic line, never as `err.message`.
4. **Preserve trace-id.** Attach the request's trace-id to the response so users can quote it in support tickets. `ref` says *what kind*; `trace_id` says *which one*. Support needs both.

**Normalize first, then handle one thing.** Wrapping an untyped error into `X0000` at the top of the handler means the rest of it has no branches: no `isApp ?` on every line, no chance of the log and the response disagreeing about which code this was, and the generic user message comes from the registry row like every other message rather than being retyped here. Two copies of that string is the drift this whole section exists to prevent.

Fastify example:

```ts
fastify.setErrorHandler((err, req, reply) => {
  // anything untyped is a bug we haven't classified — it becomes X0000, from the same table
  const e = err instanceof AppError ? err : new AppError(String(err?.message ?? err), "X0000", {}, { cause: err });

  // expected errors are a normal outcome — don't page anyone for a 404
  req.log[e.status < 500 ? "warn" : "error"]({
    err: e,                                 // logger serializes message + stack + cause chain
    code: e.code,
    ref: e.ref,
    retryable: e.retryable,
    context: e.context,
    operation: req.routeOptions?.config?.operation,
  }, `${req.method} ${req.routeOptions?.url ?? req.url} failed`);

  reply.code(e.status).send({ ref: e.ref, message: e.userMessage, trace_id: req.id });
});
```

## The trace-id

`ref` tells support *what kind* of failure; `trace_id` tells them *which one* — this user, this click, this second. Neither substitutes for the other. The error contract's part is above: the handler returns `trace_id` beside `ref`, and the UI shows both.

Everything else about the id — minting it at the edge, binding it to the logger, forwarding it on outgoing calls and queued work, minting a fresh one only where work genuinely starts, generating it client-side — is the `logging` skill's: `logging` → **The trace-id, end to end**. It lives there once so the two skills cannot drift.

## Outside HTTP

Everything above assumes a request with a response to send. Most systems have work that has neither, and it is exactly where error discipline is skipped — no framework is binding context for you, and no user is waiting to be told.

The pattern holds; only the last step changes. There is still a boundary, still one handler wired once, still one log per failure. What differs is what the handler *does* with the error.

| Context                     | The boundary             | What replaces the HTTP response                                                      |
| :-------------------------- | :----------------------- | :------------------------------------------------------------------------------------ |
| Queue consumer / worker     | The message handler      | `retryable` decides: nack and let it come back, or dead-letter it. Never silently ack a failure. |
| Scheduled job / cron        | The job entry point      | Non-zero exit or a failure marker the scheduler can see. A job that dies silently reruns forever. |
| Batch / backfill loop       | The loop, not the item   | Collect per-item failures and keep going; name every item that failed and exit non-zero if any did. A loop that skips quietly reports success on a half-done run. |
| CLI                         | `main`                   | `userMessage` to stderr, `ref` alongside it, exit code in place of status. Stack traces behind `--verbose`. |
| Mobile / desktop client     | The API client + a top-level handler | Render `userMessage` and `ref`; report the error with its `trace_id` so the client failure joins the server's story. |

Rules that hold everywhere:

- **Partial failure is still failure.** In a loop over N items, catching per item is right — swallowing is not. Collect what failed, name each one so the run can be resumed, and let the exit code or the job's failure marker say the batch did not fully succeed. The dangerous shape is a `catch` that logs and continues into a green exit.
- **`retryable` does the work here.** With no caller to hand a status to, the flag is what decides nack vs dead-letter, and what stops a poison message cycling forever. Cap attempts regardless, and log the attempt number.
- **Every unit of work gets a trace-id, carried across the boundary** — job runs, messages, CLI invocations, user actions in an app. How, and when to mint a fresh one: `logging` → **The trace-id, end to end**.
- **The user still exists, just later.** A failed job often has a person waiting on its result. The `userMessage` is what the notification, the status page, or the retry banner shows — write it even though nothing renders it synchronously.
- **A client is both.** A mobile app renders errors *and* emits logs — it shows `userMessage` and `ref`, and its trace-id is minted client-side per `logging`.

## Testing the error path

A convention nothing asserts stops being one. The happy path gets tested because it is what you built; the error path gets tested when someone writes it down. For each error path worth having, one test:

- The failing call **throws the typed error**, not a bare `Error` — assert `code` (and `ref` if you use them), not the message text. Message strings get rewritten; codes are the stable contract, which is the point of having them.
- The response **carries the user half and nothing else** — `ref`, `userMessage`, `trace_id`. Assert the internal message and `context` are *absent*. This is the test that catches a leak before a customer does.
- `retryable` is what you think it is, on the errors your retry logic branches on.

One assertion per path, at the boundary. Not a suite per error class — see `test-plan` for where these live.

## When to throw vs return

- **Throw** for exceptional conditions the current function cannot handle. Bad input at a validated boundary, missing entity in a lookup, downstream 500, etc.
- **Return** for expected results, including "not found" from a *search* (returning `null` or `[]` is fine — an empty search is a valid outcome). Returning is cheaper than throwing and doesn't need a `catch`.
- **Never** throw for control flow. `throw new Error("break loop")` is a code smell.

Rule of thumb: if the caller would immediately need to catch and translate, you should have returned instead.

## Ponytail: don't overbuild the taxonomy

Two thousand error classes for a CRUD service is over-engineering. Start with a handful:

| Class               | Status | `ref`   | Retryable | `userMessage`                                             |
| :------------------ | :----- | :------ | :-------- | :--------------------------------------------------------- |
| `ValidationError`   | 400    | `V0001` | no        | "Check the highlighted fields and try again."               |
| `UnauthorizedError` | 401    | `A0001` | no        | "Sign in to continue."                                      |
| `ForbiddenError`    | 403    | `A0002` | no        | "You don't have access to this."                            |
| `NotFoundError`     | 404    | `R0404` | no        | "We couldn't find that. It may have been deleted."          |
| `ConflictError`     | 409    | `R0409` | no        | "That already exists. Pick a different name."               |
| `RateLimitError`    | 429    | `A0003` | yes       | "Too many attempts. Wait a minute and try again."           |
| `TimeoutError`      | 504    | `D0002` | yes       | "That took too long. Try again."                            |
| `AppError`          | 500    | `X0000` | no        | "Something went wrong on our end. Try again in a moment."   |

`AppError` defaults to `retryable: false` on purpose: an unclassified bug is not something to hammer. When you learn a specific failure is transient, that is the moment it earns its own class.

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
- **Retrying a `retryable: false` error** — a 400 will still be a 400 on attempt five. All you built was a slower failure and load on a downstream that already said no.
- **Silently acking a failed queue message** — the work is gone, nothing failed loudly, and nobody finds out until someone asks where their export went.
- **Testing error paths by message text** — `expect(err.message).toBe("user not found")` breaks on a reword and teaches people that error tests are noise. Assert the `code`.

## Reviewing for error discipline

When reviewing (or when `code-review` runs), check for:

- Every `throw` uses a typed error, not `new Error(...)` (or the language's equivalent).
- Every `catch` either enriches or handles — never bare rethrow, never silent swallow.
- The error path is tested (see `test-plan` — "failure modes" is where these cases live).
- HTTP responses on 500 don't leak internals — body is `ref` + `userMessage` + `trace_id`, nothing else.
- Every user-facing error has a `userMessage` a non-engineer could act on, and a `ref` that exists in the registry.
- No `ref` was renumbered or reused.
- `retryable` is set deliberately on any error a caller retries on, and no retry loop runs against a non-retryable one.
- Background work (jobs, consumers, CLI) has a boundary handler too — failures are not silently acked, and `trace_id` is carried in from whatever queued the work.
- The error paths that matter have a test asserting the `code` and that internals stay out of the response.
- Log lines for errors include code + ref + trace-id + context (see `logging`).

## The story with logging

An error's job is to *capture* what went wrong. Logging's job is to *emit* it. The story:

1. Bad input → `throw new ValidationError('email required', { field: 'email' })` at the validation layer.
2. Global handler catches → logs `{ level: warn, code: EMAIL_REQUIRED, ref: V0001, trace_id: abc123, user_id: u_42, operation: user.create, context: { field: email } }` via the `logging` skill's structure.
3. Handler responds `400 { ref: "V0001", message: "Enter your email address.", trace_id: "abc123" }`.
4. User screenshots `V0001` into a support ticket. Support reads the public code table, answers without a developer — or escalates with the `trace_id`.
5. Operator filters logs by that `trace_id` → sees every sibling log from the request → greps `EMAIL_REQUIRED` → finds the throw site → reproduces from `context`.

If any step lacks context, debugging costs a rerun. That's the point of the discipline.
