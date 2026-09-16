---
name: code-review
description: Technical code review for correctness, security, tests, error handling, and style. Distinct from design-review (which is visual/aesthetic). Use when user says "review this code", "check my PR", "code review", "check for issues", or after implementing a feature.
---

Review recently changed code for correctness, safety, and clarity. Not a style pass — a technical read that flags what could break, what's missing, and what's over-engineered.

## Example prompts

- "Code review the changes on this branch"
- "Review the new backend code"
- "Check my PR before I open it"
- "Look for bugs in what I just wrote"

## Scope

Reviews **changed code only** by default (uncommitted + last-N commits since branch diverged from main). If the user asks for a "full review" of a file or folder, review everything they name — but flag if the review is going to run long and offer to focus on the diff instead.

## Process

1. **Find the diff.** In order of preference:
   - Uncommitted changes: `git status --short` + `git diff` + `git diff --cached`
   - Branch diff: `git diff <main-or-master>...HEAD`
   - Specific files/folder: whatever the user named
   
   If there are no changes and no target, ask what to review.

2. **Read the changed files in full** (not just the diff hunks). Context matters — a 3-line change in a security-sensitive function needs the whole function.

3. **Load the conventions you are reviewing against.** Read `errors/SKILL.md` and `logging/SKILL.md` — always, in every repo. They define the error and log contract this checklist measures against, and reviewing from memory is how a convention quietly stops being one. Then the project's own rules (`.claude/rules/`) and the stack conventions if installed (`typescript-conventions`, `flutter-conventions`). A convention nobody reviews against is a suggestion.

4. **Run the checklist** (skip categories that don't apply):

   **Correctness**
   - Edge cases: empty input, null, undefined, zero, negative, huge input, unicode
   - Off-by-one, boundary conditions
   - Async: unhandled promise rejections, missing `await`, race conditions
   - State mutation that leaks across requests / callers
   - Wrong return types vs. what callers expect

   **Security**
   - User input reaching a sink without validation (SQL, shell, filesystem, HTML)
   - Secrets in code, logs, or error messages
   - Auth check missing on a protected route
   - Authorization: does the caller have permission for *this specific resource*, not just the endpoint
   - Timing attacks on comparisons (passwords, tokens)
   - PII in logs

   **Error handling** (against `errors`)
   - Silent catches (`catch {}` or `catch (e) { /* ignore */ }`)
   - Errors that get thrown but never caught upstream
   - Fallback values that hide real failures (e.g. `.catch(() => [])`)
   - Missing cleanup on error (open file handles, DB connections, timers)
   - Bare `new Error("...")` where a typed error with a code belongs
   - Bare rethrow (`catch (e) { throw e }`) or a wrap that drops `cause`
   - HTTP status decided in the route instead of carried on the error type

   **User-facing errors** (against `errors`)
   - One message serving both the log and the user — the internal `message` and `userMessage` must be separate fields
   - A `userMessage` that says nothing: "An error occurred", "Operation failed", "Invalid request"
   - Internals in a user-facing string: DB text, constraint names, stack frames, `cause.message`, internal ids
   - A user-facing error with no `ref`, a `ref` missing from the registry, or a `ref` renumbered in this diff (they are permanent — flag as must-fix)
   - A 500 response body carrying anything but `ref` + user message + `trace_id`
   - Frontend rendering `err.message` or "Request failed with status code N" instead of the server's user-facing message

   **Observability** (against `logging`)
   - Log lines with no identity anchor — no `user_id`, `session_id`, or `tenant_id` — so one user's report cannot be filtered out of the index
   - Generic messages: "an error occurred", "something went wrong", "failed", "done"
   - `msg` built by interpolation, so the same event never groups
   - Error logs missing `err.code`, `err.ref`, `err.context`, or the recursive `cause` chain
   - `console.log` / `print` / `fmt.Println` on a path that reaches production
   - Log-then-rethrow: the same failure logged twice, once locally and once by the global handler
   - A new failure path with no log at all, or a new external call with no `duration_ms` + `status` + `target`
   - Expected errors (404, 400, 401) logged at ERROR — that is an alert firing for a normal outcome

   **Tests**
   - New public behavior with no test
   - Tests that assert on implementation detail, not observable behavior
   - Mocks of the system under test (should mock only at boundaries)
   - Skipped or `.only`-marked tests left in

   **Data & DB**
   - N+1 queries introduced
   - Missing index on a new frequently-queried column
   - Migration that isn't reversible / would break on prod data
   - Transaction boundaries around multi-step writes

   **API contract**
   - Breaking change to a request/response shape without version bump
   - New required field on an existing endpoint
   - Response shape that leaks internals (DB column names, stack traces)

   **Clarity**
   - Function doing more than one thing (>1 reason to change)
   - Naming that misleads (e.g. `getUser` that also mutates)
   - Duplication of logic that already exists elsewhere in the codebase
   - Over-abstraction: interfaces / factories for something with one caller

   **Plan gap and plan drift** (when `.design/<slug>/` or `docs/prd/` exists)

   Read `TASKS.md`, the brief, `TEST_PLAN.md`, and the PRD, and compare them against what the diff actually does. Two failures, opposite directions, both invisible in a pure code read:

   - **Gap — the plan asked for it and it is not there.** A task checked off with no code implementing it. A requirement (`FR-n`) nothing satisfies. A case in `TEST_PLAN.md` with no test. An `Implemented:` line naming a file that does not exist or does not do what the line claims. Gaps are what make a build look finished while the feature is half-built, and a ticked checkbox is the thing that hides them.
   - **Drift — it is there and the plan never asked for it.** A file nobody's task called for. A feature beyond the brief. Something the PRD listed under Non-Goals that got built anyway. Drift is rarely malicious; it is usually a good idea had mid-build. It still means the thing shipped is not the thing agreed, and the PRD or brief should be amended to match — or the code dropped.

   Report each as a finding citing both sides: the plan location and the code location, or the code location and the absence. "FR-3 requires rate limiting; nothing in the diff implements it" is a finding. "The code looks incomplete" is not.

   Where a task's `Note` line records a deliberate deviation and gives a reason, that is not drift — that is the build doing its job. Check the reason is in the doc that owns the decision: a deviation from a PRD requirement belongs in the PRD, not only in `TASKS.md`.

   **Intent and documentation drift**
   - The PR title or description no longer matches what the diff does
   - A brief, PRD, or comment describing behavior the code has since changed
   - Where a doc and the code disagree, say so and say which you believe — do not silently pick one. A cold reviewer often cannot tell whether the code drifted or the doc went stale, and guessing turns correct code into a "fix".

   **Style consistency**
   - Matches surrounding code (formatting, patterns, naming)
   - Comments follow `keep-it-simple` — no comments explaining what the code obviously does

5. **Give every finding a stable id** — `CR-1`, `CR-2`, numbered in the order you found them, never reused within a review. A fix pass reports against them one by one, a PR description can list what is still open by id, and a follow-up review can say "CR-3 is still there" instead of re-describing it. A finding without an id cannot be tracked through a fix, which is where findings quietly get lost.

6. **Categorize findings** by severity. Skip categories with nothing to say.
   - **🔴 Must fix** — bugs, security issues, breaking changes. Blocks merge.
   - **🟡 Should fix** — missing tests, unclear code, subtle correctness risk. Address before merge if cheap; note as follow-up if expensive.
   - **🟢 Consider** — style, minor polish, non-blocking suggestions.

7. **For each finding**, name:
   - **Its id** (`CR-n`)
   - **File:line**
   - **One-line description** of the issue
   - **Why it matters** (one sentence, not a paragraph)
   - **Suggested fix** — either the exact change, or "options: A vs B" if it's a judgment call

## Output shape

Short markdown, no template ceremony:

```markdown
## Code review: <branch or files>

**Scanned**: X files changed, Y lines added, Z removed.

### 🔴 Must fix
- **CR-1** `src/auth/session.ts:42` — session token compared with `===`, allows timing attack. Use `crypto.timingSafeEqual`.
- **CR-2** `src/routes/users.ts:87` — new required `email` field on existing endpoint breaks existing clients.

### 🟡 Should fix
- **CR-3** `src/services/orders.ts:120` — happy-path only test. Add: rejected payment case.
- **CR-4** `src/db/migrations/0042.sql` — index missing on `orders.user_id`; the new query on line 145 will scan.
- **CR-5** `PR description` — says the digest toggle persists immediately; the diff gives it a save button. Documentation drift counts: the description is what every future reader sees first.
- **CR-6** `TASKS.md:12` ↔ nothing in diff — task 3 is checked off and its `Implemented` line names `src/lib/digest.ts`, which does not exist. Plan gap.
- **CR-7** `src/features/settings/ThemeToggle.tsx` ↔ `DESIGN_BRIEF.md` — a theme toggle nobody asked for; the brief lists theming under Out of Scope. Plan drift: drop it, or amend the brief.

### 🟢 Consider
- **CR-8** `src/utils/format.ts:15` — duplicates `formatCurrency` already in `src/lib/money.ts`. Reuse?

### What's good
- Error handling in the payment retry logic is careful; timeouts and idempotency keys are correct.
```

Always include a "What's good" section if there's something worth noting. A review that only lists problems is unbalanced.

## Rules

- **Facts, not vibes.** Every finding cites a file:line. "This feels off" is not a finding — either name the concrete issue or drop it.
- **One issue per bullet.** If a bullet needs "and," split it.
- **Don't rewrite the code.** Point at the issue and suggest a direction, don't paste a whole replacement unless the fix is <5 lines.
- **Respect the review scope.** Don't drift into unrelated files unless a change in scope pulls them in.
- **Say when you're not sure.** "Might be a race condition — depends on whether X can be called concurrently. Can you confirm?" beats a confident wrong finding.
- **Follow `keep-it-simple`** — the review itself should be terse. No preamble, no summary of what a code review is.

## When to stop and ask

- The diff is huge (>500 lines changed across many files). Offer to review in slices.
- The change touches security-critical code (auth, crypto, payments) and the reviewer isn't sure of the invariant. Ask before flagging.
- The user asked for review but the diff is empty. Ask which branch or files.

## Done when

- Every finding cites `file:line` and carries a `CR-n` id
- The plan was checked for gaps and drift where `.design/<slug>/` or `docs/prd/` exists — a checked-off task with no code, and code no task asked for, are both findings
- Findings are bucketed must-fix / should-fix / consider
- The report is saved to `.design/<slug>/CODE_REVIEW.md` when a design folder exists
- "What's good" is filled in — a review that only lists problems is unbalanced

**Then hand off.** Say: "Code review done: N must-fix, N should-fix." Name the single biggest issue, then: "Next: fix the must-fix items, or **`/atelier:design-review`** for the visual pass." 
