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

3. **Run the checklist** (skip categories that don't apply):

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

   **Error handling**
   - Silent catches (`catch {}` or `catch (e) { /* ignore */ }`)
   - Errors that get thrown but never caught upstream
   - Fallback values that hide real failures (e.g. `.catch(() => [])`)
   - Missing cleanup on error (open file handles, DB connections, timers)

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

   **Intent and documentation drift**
   - The PR title or description no longer matches what the diff does
   - A brief, PRD, or comment describing behavior the code has since changed
   - Where a doc and the code disagree, say so and say which you believe — do not silently pick one. A cold reviewer often cannot tell whether the code drifted or the doc went stale, and guessing turns correct code into a "fix".

   **Style consistency**
   - Matches surrounding code (formatting, patterns, naming)
   - Comments follow `keep-it-simple` — no comments explaining what the code obviously does

4. **Give every finding a stable id** — `CR-1`, `CR-2`, numbered in the order you found them, never reused within a review. A fix pass reports against them one by one, a PR description can list what is still open by id, and a follow-up review can say "CR-3 is still there" instead of re-describing it. A finding without an id cannot be tracked through a fix, which is where findings quietly get lost.

5. **Categorize findings** by severity. Skip categories with nothing to say.
   - **🔴 Must fix** — bugs, security issues, breaking changes. Blocks merge.
   - **🟡 Should fix** — missing tests, unclear code, subtle correctness risk. Address before merge if cheap; note as follow-up if expensive.
   - **🟢 Consider** — style, minor polish, non-blocking suggestions.

6. **For each finding**, name:
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

### 🟢 Consider
- **CR-6** `src/utils/format.ts:15` — duplicates `formatCurrency` already in `src/lib/money.ts`. Reuse?

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
- Findings are bucketed must-fix / should-fix / consider
- The report is saved to `.design/<slug>/CODE_REVIEW.md` when a design folder exists
- "What's good" is filled in — a review that only lists problems is unbalanced

**Then hand off.** Say: "Code review done: N must-fix, N should-fix." Name the single biggest issue, then: "Next: fix the must-fix items, or **`/atelier:design-review`** for the visual pass." 
