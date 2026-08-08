---
name: logging
description: Emit logs that are structured, contextual, and let you debug from them without rerunning the code. Every log carries trace-id, user-id (if authed), and operation name. Errors are logged with the full cause chain from the `errors` skill. Level discipline (DEBUG dev-only, INFO business events, WARN recoverable, ERROR needs-attention). Never log secrets, PII, tokens, cookies. Use when adding a log line, setting up a logger, reviewing a service for observability, or debugging a "why isn't there a log for this" gap.
---

Logs are the evidence trail. The bar: from a single log line, plus its siblings sharing the same trace-id, a reader should be able to reconstruct what happened without re-running the code. That's the whole game. Everything else in this skill is in service of that.

Pairs with `errors` — the error is *designed* over there; here it gets *emitted*. Neither works without the other.

## Example prompts

- "Add logging to the checkout flow"
- "Why isn't there a log for this failure?"
- "Set up structured logging for a new Fastify service"
- "Review this handler for observability"

## Core principles

1. **Structured, always.** Key/value pairs. Never string-concat (`"user " + id + " failed"`). Never printf. A log entry is a JSON object; the message is one field among many.

2. **One log per outcome, not per line.** Log at the entry and exit of interesting operations. Do not log every branch — that's what DEBUG is for, in local dev, off in prod.

3. **Every log carries the same context.** At minimum: `trace_id` (per request), `user_id` (if authenticated), `operation` (the business event, e.g. `checkout.complete`). Set these once via a request-scoped logger (Fastify: `req.log`; Node: AsyncLocalStorage; Go: context.Context). Never pass them by hand into every call.

4. **Errors log the full chain.** The `errors` skill defines the error shape. Logging it means: `code`, `message`, `context`, and the recursive `cause` chain. Not just `err.message`.

5. **Level discipline** (see the table below). Wrong level = alerts that don't fire, or dashboards that drown.

6. **Never log secrets, PII, tokens, cookies, session data.** Not even in DEBUG. Not "we'll strip them later." Never write them in the first place — the redaction step *will* be forgotten.

## The log entry shape

Every entry, minimum:

| Field       | Purpose                                                                            |
| :---------- | :--------------------------------------------------------------------------------- |
| `level`     | `debug` `info` `warn` `error` `fatal`                                              |
| `msg`       | Short, human. `"checkout complete"` not `"the checkout has been completed by user"` |
| `time`      | ISO 8601 or epoch (logger default)                                                 |
| `trace_id`  | The request's trace-id. Correlates all logs for one request.                       |
| `operation` | Business event name. `checkout.complete`, `auth.login`, `user.create`.             |
| `user_id`   | Authenticated user id (if any). Not the email, not the name.                       |

On error entries, add:

| Field          | Purpose                                                                    |
| :------------- | :------------------------------------------------------------------------- |
| `err.code`     | The stable code from the `errors` skill.                                   |
| `err.message`  | Error message.                                                             |
| `err.context`  | The structured context from the thrown error.                              |
| `err.cause`    | The wrapped underlying error (walked recursively — one field per level).   |
| `err.stack`    | Stack trace. In prod, keep it in logs, not in HTTP responses.              |

On external calls, add:

| Field         | Purpose                                            |
| :------------ | :------------------------------------------------- |
| `duration_ms` | How long the call took                             |
| `status`      | HTTP status (or equivalent)                        |
| `target`      | What was called (`postgres.users`, `stripe.charge`) |

## Level discipline

| Level  | Use for                                        | Prod default | Example                                   |
| :----- | :--------------------------------------------- | :----------- | :---------------------------------------- |
| DEBUG  | Granular flow, dev-only                        | off          | "cache lookup for key `x`"                |
| INFO   | Business events, outcomes                      | on           | "checkout complete", "user signed up"     |
| WARN   | Recoverable issues, degraded but working       | on           | "retry succeeded on attempt 3", "rate-limited caller" |
| ERROR  | Needs attention. Unexpected failure.           | on           | "unhandled exception", "downstream 500"   |
| FATAL  | Process dying (crash, unrecoverable init)      | on           | "database connection lost, shutting down" |

Cardinal sins:

- Logging a caught-and-handled expected error at ERROR. It fires alerts for a normal outcome.
- Logging every successful DB call at INFO. Drowns real signal.
- Using `console.log` in prod. Not structured, no level, no context. Firing offense.

## Where to log

- **Once at request entry.** `req.log.info({ operation, params }, "request start")`. Optional; usually the framework's access log covers it.
- **At every business outcome.** `req.log.info({ operation: "checkout.complete", order_id, amount }, "checkout complete")`.
- **On every external call boundary.** `req.log.info({ target, duration_ms, status }, "external call")`. INFO for success, WARN for retry, ERROR for failure.
- **In the global error handler.** Exactly one log per uncaught error, at the level determined by error type (WARN for expected, ERROR for unexpected). See `errors`.

Where NOT to log:

- Inside a tight loop, unless at DEBUG.
- Every step of a happy-path flow. Log the outcome, not the journey.
- The same event at two levels (once in the handler that catches, once in the global handler). Log once, at the boundary.

## Setup — the once-per-service work

**Node / Fastify:**

```ts
import pino from "pino";
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
  base: { service: "checkout-api" },
});
fastify.register(require("@fastify/http-proxy"), { logger });
// req.log is a child logger with req_id + trace_id already bound
```

**Anywhere:** propagate the trace-id via an `x-request-id` (or `traceparent` for OpenTelemetry) header on every outgoing call, so downstream services correlate.

## The story with errors

1. Request enters → framework binds a `trace_id` to `req.log`.
2. Business logic runs → INFO logs at outcomes with `operation` names.
3. External call → INFO with `duration_ms` + `status` + `target`.
4. Error thrown (from the `errors` skill) → propagates to the global error handler.
5. Global handler logs at the right level: WARN for expected, ERROR for unexpected. Entry includes `err.code`, `err.context`, `err.cause` chain, `trace_id`.
6. HTTP response goes back with `{ code, message, trace_id }` — the same `trace_id` that's in the logs.
7. Operator sees the log in the dashboard → filters by `trace_id` → sees all sibling logs from the same request → greps the code for `err.code` → finds where it was thrown → reproduces with the captured `context`.

If any of steps 1–6 is missing, step 7 fails. That's when debugging costs hours.

## Anti-patterns

- **Unstructured strings**: `log.info("user " + id + " logged in")`. Do: `log.info({ user_id: id, operation: "auth.login" }, "user logged in")`.
- **Logging the same event twice.** Handler catches, logs, rethrows → global handler catches, logs again. Pick one. Global handler wins.
- **Logging then throwing without cause.** `log.error("failed"); throw new Error("failed")` — the two log entries have no link. Attach the error to the log, or let the global handler log it.
- **`console.log` in prod.** Bypasses structure, level, redaction. If it slips into a PR, `code-review` should flag it.
- **Redacting after the fact.** Don't build a redact list of 40 fields. Structure your logs so secrets never enter them in the first place.
- **PII in log context.** `user_id` is fine. `user_email`, `user_name`, `user_ip` (unless you have a specific compliance-cleared use) is not.

## Reviewing for observability

When reviewing (or in `code-review`), check:

- Every INFO/WARN/ERROR entry has `trace_id` + `operation` bound (via request-scoped logger).
- Every error entry has `err.code` + `err.context` + `err.cause` (recursive).
- No `console.log`. No `fmt.Println`. No `print(...)`.
- No secrets in any log's key/value pairs. No cookies, no tokens, no PII beyond `user_id`.
- External calls have `duration_ms` + `status`.
- No log-then-rethrow. Log once, at the boundary.
