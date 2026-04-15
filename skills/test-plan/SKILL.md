---
name: test-plan
description: Write a short test plan for a change before implementing — list the cases that must pass, what to break to prove them, and what NOT to test. Use before starting non-trivial work, when asked for a "test plan", or when reviewing a PR to sanity-check coverage.
---

Before writing code (or before a PR ships), name the cases that must pass. A test plan is a filter that catches missed edge cases *before* the implementation locks in an assumption.

## Example prompts

- "Write a test plan for the auth middleware change"
- "What should I test before merging this?"
- "Plan the tests for the checkout retry logic"
- "Test plan for the new /users route"

## Process

1. **Restate the change** in one sentence. "This adds X so that Y." If you can't state it clearly, the code isn't ready to test yet.

2. **List the cases** in three groups. Aim for 3–8 total cases, not 30. Coverage over completeness.

   - **Happy path** (1–2 cases): the normal expected use. Prove the feature does the thing.
   - **Failure modes** (2–4 cases): each *distinct* failure the user or system can trigger. Bad input, missing auth, downstream unavailable, race, timeout. Not every permutation — the *distinct* ones.
   - **Regressions to guard** (0–2 cases): existing behavior that this change is at risk of breaking. Only include if the change touches shared code.

3. **For each case, name the concrete assertion.** "It rejects a request with no token → returns 401 with `{ error: 'unauthorized' }`." Not "auth works."

4. **Call out what NOT to test.** This is as important as the list. Reasons:
   - Framework behavior (Fastify parses JSON — no need to test that)
   - Trivial getters
   - Cases where the type system already guarantees the invariant
   - Third-party services (mock the boundary, don't retest the vendor)

5. **Name the test level** for each case: unit, integration, e2e. Default to the lowest level that still proves the case. Push to integration only when the case genuinely crosses a boundary (DB, HTTP, filesystem).

## Output shape

Short markdown, no template ceremony. Something like:

```markdown
## Test plan: [change name]

**What it does**: [one sentence]

**Cases**
- [unit] happy: valid input → returns X
- [unit] rejects malformed body → 400 with field-level error
- [integration] token expired → 401, no DB write
- [integration] downstream 503 → returns 503 to caller, does not retry
- [regression] existing GET /users still returns unchanged shape

**Not testing**
- Fastify JSON parsing (framework)
- Third-party JWT library internals (mocked at boundary)
```

## Rules

- **Assertions, not intentions.** "Handles bad input" is not a test case. "Returns 400 when `email` is missing" is.
- **One case per line.** If a bullet needs an "and," split it.
- **Don't design the tests, name them.** The plan is a checklist, not code. If you can't name the case in one line, the case isn't clear enough.
- **A plan with only happy-path cases is a bad plan.** If you can't think of a failure mode, ask the user what the failure modes are. That's the whole reason this skill exists.
