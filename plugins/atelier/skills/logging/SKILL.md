---
name: logging
description: Emit structured logs that tell a story — who, where, what, how it ended — so you can debug without rerunning. Every entry: trace-id, identity anchor, operation, specific message; errors carry their cause chain; no secrets or PII. Use when adding a log line, setting up a logger, carrying a trace across a queue, reviewing observability, or cutting duplicate and noisy logs.
---

Logs are the evidence trail. The bar: from a single log line, plus its siblings sharing the same trace-id, a reader should be able to reconstruct what happened without re-running the code. That's the whole game. Everything else in this skill is in service of that.

**A log line is one sentence in a story.** Read on its own it answers four questions — *who* (identity anchor), *where* (service, operation), *what* (the specific event), *how it ended* (outcome, duration, error). Read in trace order with its siblings it becomes a narrative: request arrived → user resolved → payment attempted → card declined → 402 returned. If a line can't answer its four questions, or the sequence has a hole where something clearly happened, the story is broken and the next incident costs hours.

Pairs with `errors` — the error is *designed* over there; here it gets *emitted*. Neither works without the other. The trace-id lives here; `errors` references it.

## Example prompts

- "Add logging to the checkout flow"
- "Why isn't there a log for this failure?"
- "Set up structured logging for a new Fastify service"
- "Review this handler for observability"

## Core principles

1. **Structured, always.** Key/value pairs. Never string-concat (`"user " + id + " failed"`). Never printf. A log entry is a JSON object; the message is one field among many.

2. **One log per outcome, not per line.** Log at the entry and exit of interesting operations. Do not log every branch — that's what DEBUG is for, in local dev, off in prod.

3. **Every log carries the same context.** At minimum: `trace_id` (per request), an identity anchor (see 4), `operation` (the business event, e.g. `checkout.complete`). Set these once via a request-scoped logger (Fastify: `req.log`; Node: AsyncLocalStorage; Go: context.Context). Never pass them by hand into every call. Work that isn't a request gets the same treatment — see [Outside a request](#outside-a-request).

4. **Always anchor to an identity.** When a user says "it broke around 2pm", you need one field to filter on. Bind whatever identity exists, in this order of preference: `user_id` when authenticated, `session_id` or `anon_id` when not, `tenant_id` / `org_id` whenever the system is multi-tenant (bind it *alongside* `user_id`, not instead — support tickets arrive per-account). A log with no identity anchor is unfilterable and effectively lost — and that applies to background work too, where the anchors differ but the rule doesn't.

5. **The message is specific and constant.** `msg` names the event and its outcome — `"payment declined"`, `"checkout complete"`, `"user lookup failed"`. Never the generic filler: "an error occurred", "something went wrong", "error", "failed", "done", "here". Those describe every log ever written, so they distinguish nothing. And keep `msg` a fixed string per event — the varying parts (`user_id`, `amount`, `card_last4`) go in fields, which is what makes "show me every declined payment" a single query instead of a regex.

6. **Errors log the full chain.** The `errors` skill defines the error shape. Logging it means: `code`, `ref`, the internal `message`, `context`, and the recursive `cause` chain. Not just `err.message` — and never the `userMessage` alone, which is written to be vague.

7. **Level discipline** (see the table below). Wrong level = alerts that don't fire, or dashboards that drown.

8. **Never log secrets, PII, tokens, cookies, session data.** Not even in DEBUG. Not "we'll strip them later." Never write them in the first place — the redaction step *will* be forgotten. The identity anchors in 4 are the exception that proves it: opaque ids are safe, the things they unlock are not. `session_id` means a random correlation id, never the session cookie or token value — if logging it would let someone impersonate the user, it's a secret, not an anchor.

## The log entry shape

Every entry, minimum:

| Field       | Answers    | Purpose                                                                             |
| :---------- | :--------- | :----------------------------------------------------------------------------------- |
| `level`     | how it ended | `debug` `info` `warn` `error` `fatal`                                              |
| `msg`       | what       | Specific, fixed per event. `"checkout complete"`, never `"an error occurred"`        |
| `time`      | when       | ISO 8601 or epoch (logger default)                                                  |
| `trace_id`  | which one  | The request's trace-id. Correlates all logs for one request.                         |
| `service`   | where      | Which deployable emitted this. Bound once in the logger's `base`.                    |
| `operation` | where      | Business event name. `checkout.complete`, `auth.login`, `user.create`.               |
| `user_id`   | who        | Authenticated user id (if any). Not the email, not the name.                         |
| `session_id`| who        | When unauthenticated — the anchor for pre-login failures (signup, password reset).   |
| `tenant_id` | who        | Account / org, whenever the system is multi-tenant. Support tickets arrive per-account. |
| `outcome`   | how it ended | `ok` / `denied` / `failed` on operations where level alone is ambiguous.           |

On error entries, add:

| Field          | Purpose                                                                    |
| :------------- | :------------------------------------------------------------------------- |
| `err.code`     | The stable internal code from the `errors` skill.                          |
| `err.ref`      | The public reference code (`A0001`) the user was shown. Lets you search logs by what a support ticket quotes. |
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

## Writing the story

A trace read top to bottom should read like a report of what happened. Same request, two versions:

Broken — no anchor, generic messages, no outcome:

```
INFO  processing
INFO  ok
ERROR an error occurred
```

Whole — every line answers who / where / what / how it ended:

```
INFO  {operation: checkout.start,   user_id: u_42, tenant_id: t_9, cart_id: c_71, items: 3}   "checkout started"
INFO  {operation: checkout.charge,  user_id: u_42, tenant_id: t_9, target: stripe.charge, amount_cents: 4200, duration_ms: 310, status: 402}  "payment declined"
WARN  {operation: checkout.charge,  user_id: u_42, tenant_id: t_9, err.code: CARD_DECLINED, err.ref: P0001, outcome: failed}  "checkout failed"
```

Nobody has to guess. Who: `u_42` on `t_9`. Where: `checkout.charge`. What: Stripe returned 402 in 310ms. How it ended: declined, `P0001`, which is the exact code the user is reading off their screen.

The test before you write a line: **if this is the only line I have at 3am, what can't I answer?** Add that field. If the answer is "nothing", the line is done.

Filterability follows from the anchors. Each of these should be one query:

- "This user reported a problem" → filter `user_id`.
- "This account is complaining" → filter `tenant_id`.
- "The user quoted code A0001" → filter `err.ref`.
- "Show me this one request" → filter `trace_id`.
- "Is checkout broken for everyone or just them?" → filter `operation`, group by `outcome`.

If a question on that list needs a full-text search, a field is missing.

## Where to log

- **Once at request entry.** `req.log.info({ operation, params }, "request start")`. Optional; usually the framework's access log covers it.
- **At every business outcome.** `req.log.info({ operation: "checkout.complete", order_id, amount }, "checkout complete")`.
- **On every external call boundary.** `req.log.info({ target, duration_ms, status }, "external call")`. INFO for success, WARN for retry, ERROR for failure.
- **In the global error handler.** Exactly one log per uncaught error, at the level determined by error type (WARN for expected, ERROR for unexpected). See `errors`.

Where NOT to log:

- Inside a tight loop, unless at DEBUG.
- Every step of a happy-path flow. Log the outcome, not the journey.
- The same event at two levels (once in the handler that catches, once in the global handler). Log once, at the boundary.

## Outside a request

Most of this skill says "request", because that is where the framework does the work for you. The unit that actually matters is **the unit of work**: the thing that starts, does something, and ends. A request is one. So is a job run, a queue message, a CLI invocation, a user action in an app. Each gets a trace-id and a scoped logger bound at its entry point — the same pattern, minus the framework doing it for you.

| Unit of work        | Bind at              | Anchors to bind                                        |
| :------------------ | :------------------- | :------------------------------------------------------ |
| HTTP request        | Framework hook       | `trace_id`, `user_id` / `session_id`, `tenant_id`        |
| Queue message       | The consumer         | `trace_id` (from the message), `job_id`, `attempt`, the `user_id` it is on behalf of |
| Scheduled job       | The job entry point  | `trace_id` (fresh), `job_name`, `run_id`, `scheduled_for` |
| CLI invocation      | `main`               | `trace_id` (fresh), `command`, `args` (no secrets)       |
| Mobile / desktop    | Per user action      | `trace_id` (fresh, client-side), `session_id`, `user_id`, `app_version`, `platform` |

The trace-id rules for all of these are in [The trace-id, end to end](#the-trace-id-end-to-end).

**Clients log too.** A mobile or desktop app is a log emitter, not just a UI. Its trace-id is minted client-side (step 1 below). Then the local specifics: buffer and upload rather than logging per line over the network, bind `app_version` and `platform` (the bug is usually one build or one OS), and drop the buffer on logout. An offline client's logs arrive late and out of order — order by the event's own timestamp, never by arrival.

**Nothing is watching a background failure.** A request failure has a user retrying and telling you. A job that dies at 3am has nobody, so the log is the *only* evidence — log the start and the end of every run, not just failures, or "did it run at all?" becomes unanswerable. Include `attempt` on retried work, so a poison message is visible as one message failing forty times rather than forty failures.

## The trace-id, end to end

This skill owns the trace-id; `errors` defers here. `ref` tells support *what kind* of failure, `trace_id` tells them *which one*, and the chain only works if every link exists:

1. **Mint at the edge — once.** The first service to see the request mints one, unless the caller sent `x-request-id` or a W3C `traceparent` — then honor theirs. Fastify's `req.id` does this. Outside a request, mint a fresh one only where a unit of work genuinely starts on its own: a cron tick, a cold app launch, a user typing a command, a user action in a client app (sent up as a header, so the client log and the server log share an id).
2. **Bind it to the scoped logger** so every line carries it without anyone passing it around.
3. **Forward it on every outgoing call** — `x-request-id` (or `traceparent` for OpenTelemetry) on HTTP, an attribute on the queue message, a field in the job payload. The consumer binds the id it received rather than minting a new one, so a queued email traces back to the click that caused it, across two processes and twenty minutes. When a job fans out, log `parent_trace_id` on the children, or a thousand traces that were one thing look unrelated.
4. **Return it in the response**, in the body and as a response header, on success as well as failure. Support asks for it on "the page was slow" too.
5. **Show it in the UI** next to the user-facing message, selectable and copyable. A trace-id nobody can read off the screen is one nobody will ever quote.

Step 5 is the one that gets skipped, and skipping it quietly wastes the other four.

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

## The story with errors

1. Request enters → framework binds a `trace_id` to `req.log`.
2. Business logic runs → INFO logs at outcomes with `operation` names.
3. External call → INFO with `duration_ms` + `status` + `target`.
4. Error thrown (from the `errors` skill) → propagates to the global error handler.
5. Global handler logs at the right level: WARN for expected, ERROR for unexpected. Entry includes `err.code`, `err.ref`, `err.context`, `err.cause` chain, `trace_id`, and the identity anchor.
6. HTTP response goes back with `{ ref, message, trace_id }` — the user-facing half of the error, carrying the same `trace_id` that's in the logs.
7. Operator sees the log in the dashboard → filters by `trace_id` (or by `user_id` when all they have is "it broke for me") → sees all sibling logs from the same request → greps the code for `err.code` → finds where it was thrown → reproduces with the captured `context`.

If any of steps 1–6 is missing, step 7 fails. That's when debugging costs hours.

## Anti-patterns

- **Unstructured strings**: `log.info("user " + id + " logged in")`. Do: `log.info({ user_id: id, operation: "auth.login" }, "user logged in")`.
- **Generic messages**: `"an error occurred"`, `"something went wrong"`, `"failed"`, `"done"`, `"here"`. They match every line in the system and identify none. Name the event and its outcome: `"password reset token expired"`.
- **Anonymous logs**: no `user_id`, no `session_id`, no `tenant_id`. When a user reports a bug there is nothing to filter by, so their evidence is unreachable even though it's sitting in the index.
- **Interpolating the variable part into `msg`**: `` `payment declined for ${userId}` `` makes every line unique, so grouping and alerting break. Fixed message, varying fields.
- **Logging the error without its public code**: the user quotes `P0001` and nothing in the logs contains that string. Bind `err.ref` alongside `err.code`.
- **Minting a fresh trace-id in the consumer**: the job logs and the request that queued it become unjoinable. Carry the id in the message.
- **Background work that only logs failures**: when nothing appears, you cannot tell a clean run from a job that never fired.
- **Logging the same event twice.** Handler catches, logs, rethrows → global handler catches, logs again. Pick one. Global handler wins.
- **Logging then throwing without cause.** `log.error("failed"); throw new Error("failed")` — the two log entries have no link. Attach the error to the log, or let the global handler log it.
- **`console.log` in prod.** Bypasses structure, level, redaction. If it slips into a PR, `code-review` should flag it.
- **Redacting after the fact.** Don't build a redact list of 40 fields. Structure your logs so secrets never enter them in the first place.
- **PII in log context.** `user_id` is fine. `user_email`, `user_name`, `user_ip` (unless you have a specific compliance-cleared use) is not.

## Testing that the log exists

Logging is the one convention that fails silently: nothing breaks when a log line goes missing, you just find out months later, mid-incident, that the evidence was never written. So the error paths that matter get one assertion, the same way `errors` asks for one on the throw.

Capture logs with a test transport (pino: a stream into an array; most loggers have an equivalent) and assert on the **structure, not the prose**:

- One entry was emitted, at the expected **level** — this is what catches an expected 404 logged at ERROR, and the log-twice bug where a handler and the global handler both fire.
- It carries `err.code` and the **identity anchor**. Assert the field is present, not its value.
- It carries **no secret** — for anything that handles a token, password, or card, assert the raw value does not appear anywhere in the serialized entry. That test is worth more than the redact list, because it fails when someone adds a field the list never heard of.

Never assert on `msg` text. It is prose, it gets reworded, and a test that breaks on rewording teaches people to stop writing tests. The `code` is the contract.

## Reviewing for observability

When reviewing (or in `code-review`), check:

- Every INFO/WARN/ERROR entry has `trace_id` + `operation` + an identity anchor bound (via request-scoped logger).
- No generic messages. Every `msg` names a specific event and its outcome, and is constant per event.
- Every error entry has `err.code` + `err.ref` + `err.context` + `err.cause` (recursive).
- The trace reads as a story — no gap where something clearly happened but nothing was logged.
- No `console.log`. No `fmt.Println`. No `print(...)`.
- No secrets in any log's key/value pairs. No cookies, no tokens, no PII beyond `user_id`.
- External calls have `duration_ms` + `status`.
- No log-then-rethrow. Log once, at the boundary.
- Background work — jobs, consumers, CLI — binds a scoped logger too, with `trace_id` carried from whatever queued it rather than freshly minted.
- Retried work logs its `attempt`, and job runs log their start as well as their end.
- The error paths that matter assert the log was emitted, at the right level, with no secret in it.
