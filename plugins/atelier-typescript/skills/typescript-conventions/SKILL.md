---
name: typescript-conventions
description: House conventions for TypeScript code — type discipline, module shape, async rules, validation boundaries, plus React (frontend) and Fastify/Node (backend) specifics in the reference files. Use this skill whenever writing, refactoring, or reviewing TypeScript, TSX, React components, or Fastify routes and plugins, and whenever `/build` implements a task in a TypeScript repo. Also use when deciding between `type` and `interface`, whether to memoize a component, where validation belongs, or how to shape a module's exports.
---

Conventions for TypeScript in this house style. The point is not to be comprehensive — it is to settle the handful of decisions that otherwise get made differently every time and then cost a reviewer an argument.

## The first rule: match what is already there

Read before writing. If the project already picked a schema library, a test runner, a state manager, a file layout, or an export style, **that choice wins over anything in this skill**. A codebase with two idioms for one job is worse than a codebase with one mediocre idiom, because every reader now has to know which files follow which.

These are the defaults for greenfield code and the tiebreaker when the codebase is genuinely silent. They are not a licence to refactor what exists. If an existing convention looks wrong, say so in one line and keep matching it — changing it is its own task with its own review.

## Which reference to read

| Working on | Read |
| ---------- | ---- |
| React components, pages, hooks, client state, forms | `references/react.md` |
| Fastify routes, plugins, services, migrations, server setup | `references/fastify.md` |
| Shared types, utils, config, anything stack-neutral | This file alone |

Read only the half you need — both reference files assume the shared rules below.

## Type discipline

**`strict: true`, and no `any`.** When a type is genuinely unknown, use `unknown` and narrow it. `unknown` forces the check that `any` skips, which is the whole point. An `any` that reaches a shared type erases checking for every downstream caller, silently and permanently.

Where a third-party type is wrong or missing, write the narrow type you need and cast once at that boundary, with a comment naming why. One deliberate cast at an edge is fine; `any` threaded through three functions is not.

**Types at the boundaries, inference inside.** Annotate exported signatures, public return types, and anything crossing a module or network edge — those are contracts, and an inferred contract changes silently when the implementation does. Inside a function, let inference work; annotating every local is noise that goes stale.

**Prefer `satisfies` when you want checking *and* inference.** `const config = {...} satisfies Config` verifies the shape without widening the value, so the literal types survive. A plain annotation throws them away.

**Model impossible states out of existence.** A discriminated union beats a bag of optional fields:

```ts
// Every field optional — nothing stops { status: 'success', error: 'boom' }
type Result = { status: string; data?: User; error?: string }

// The compiler now rejects the nonsense combinations
type Result =
  | { status: 'success'; data: User }
  | { status: 'error'; error: string }
```

This is the highest-leverage typing habit there is. Most "how did we even get into this state" bugs are a state the type system was never asked to forbid.

**No TypeScript `enum`.** It emits runtime code, is nominally typed in ways that surprise people, and `const enum` breaks under `isolatedModules`. Use a union of string literals, or a `const` object with a derived type when the values are needed at runtime:

```ts
const Plan = { pro: 'pro', business: 'business' } as const
type Plan = (typeof Plan)[keyof typeof Plan]
```

**`type` by default; `interface` when you need declaration merging or `implements`.** Both express object shapes. Picking one default removes a recurring coin-flip. Don't mix within a file.

## Module shape

**Named exports, not default.** Defaults get renamed freely at each import site, which breaks grep and makes refactors invisible in review. The exception is a framework that requires a default — a Next.js page or layout — where you follow the framework.

**No barrel files.** An `index.ts` re-exporting a folder looks tidy and costs you three ways: it defeats tree-shaking, it creates import cycles that only surface at runtime, and it turns one changed file into a rebuild of everything that touched the barrel. Import from the file that defines the thing.

**Colocate.** A component's test, styles, and types live beside it, not in a parallel `types/` or `__tests__/` tree. A shared type earns its move to a shared module by actually being shared — two or more real consumers, not one plus a hunch.

**One file, one reason to change.** A module exporting a route handler, a database query, and a date formatter has three. Split it. Same instinct as a fat function, one level up.

## Async

**No floating promises.** Every promise is awaited, returned, or handed to something that handles rejection. An unhandled rejection crashes Node by default and vanishes silently in the browser — both worse than the error you were avoiding.

**`await` in a loop means you meant it.** Sequential awaits are right when each iteration depends on the last, or when you are deliberately rate-limiting. When iterations are independent, `Promise.all` is not an optimization but the correct semantics — a sequential loop over 50 independent fetches is a latency bug. Where partial failure is acceptable, `Promise.allSettled` says so and keeps the successes.

**Never fire and forget.** Background work that outlives the request — an email send, a cache warm — is either awaited or handed to a real queue. A dangling promise loses its error and can be killed mid-flight at shutdown.

## Validation

Validate at the trust boundary: request bodies, query strings, webhook payloads, environment variables, anything parsed from disk or a third party. Past that edge, the types are the guarantee, and re-validating internally is noise that implies the boundary check isn't trusted.

Use whatever validator the project already has, and never add a second — two schema libraries means two sources of truth for one shape, and they drift.

## Errors and logging

These have their own skills and apply to TypeScript code without restating here:

- **`errors`** — typed errors with stable codes and cause chains, thrown not returned, so a log line explains itself.
- **`logging`** — structured logs carrying trace-id and operation name, level discipline, no secrets or PII.

Read them when adding an error type or a log line rather than inventing a local pattern.

## Comments

Comments explain **why**, never **what** — the code already says what it does. And they describe the code as it is now, never how it got here: no `// changed from`, no `// previously`, no `// added per review feedback`. That history belongs to git, where it is accurate and searchable; in a comment it is unverifiable and starts rotting the moment the next person edits nearby.

## Testing

Test observable behavior, not implementation. A test asserting that a private method was called breaks on every refactor while catching nothing; a test asserting the output for a given input survives the refactor and catches the regression.

Mock at boundaries only — network, clock, filesystem. Mocking the thing under test means you are testing your mock.

Every bug fix gets the test that would have caught it. That is both the cheapest moment to write it and the only proof the fix works.

## Anti-patterns

- **`as` to silence an error you don't understand.** The cast doesn't make the value that shape; it makes the compiler stop telling you it isn't.
- **`!` on something that can actually be null.** Narrow it or handle it. `!` is a promise to the compiler that you'll be wrong about eventually.
- **An accumulating `utils.ts`.** Unrelated helpers in one file is a folder with no names. Split by domain once it passes a handful of functions.
- **Exporting a type only to satisfy a lint rule.** If nothing imports it, delete it.
- **`try/catch` that logs and rethrows unchanged.** It adds a stack frame and a duplicate log line. Either handle it, add context via `cause`, or let it reach the handler that already logs.
