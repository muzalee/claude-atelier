---
name: test-plan
description: Write a short test plan for a change before implementing — name the cases that must pass, the level each should live at (unit / integration / e2e), what to break to prove them, and what NOT to test. Saves to `.design/<slug>/TEST_PLAN.md` when a `.design/<slug>/` folder exists (invoked from `/design` or standalone in a design-driven project); otherwise outputs inline. Use before starting non-trivial work, when asked for a "test plan", when reviewing a PR to sanity-check coverage, or as part of the `/design` pipeline.
---

Before writing code (or before a PR ships), name the cases that must pass — and the *level* they should live at. Picking the wrong level catches bugs but wastes weeks maintaining flaky fake tests.

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

4. **Pick the right level for each case** — see the "Test level guide" below. Default to the highest level where the test is still fast enough to run frequently.

5. **Call out what NOT to test.** This is as important as the list. Reasons:
   - Framework behavior (Fastify parses JSON — no need to test that)
   - Trivial getters
   - Cases where the type system already guarantees the invariant
   - Third-party services (mock the boundary at the highest level, don't retest the vendor)

6. **Save the plan.** If `.design/<slug>/` exists (invoked from `/design` or the project uses design folders), write to `.design/<slug>/TEST_PLAN.md`. Otherwise output inline.

## Test level guide

The choice of level matters. Well-picked catches bugs cheaply; badly-picked wastes weeks on flaky fake tests.

### Unit — real logic, no mocks

Use ONLY for pure functions with real logic: parsers, formatters, calculators, algorithms, small stateful reducers. Real inputs, real outputs. **Zero mocks.**

If a unit test needs a mock, that's the signal to move it up a level. A "unit test" that mocks the DB, the HTTP client, and the filesystem is testing that the mocks do what you told them to. Tautology.

### Integration — the default for business logic

Use for anything that crosses a real boundary: DB, HTTP, filesystem, another module. Spin up the real dependency (Testcontainers for Postgres/Redis, a local fastify instance, a temp dir). This is where most bugs live and where most tests should live.

**Integration beats mocked-unit almost every time** for logic that touches shared systems. Bugs at the seam (wrong SQL, wrong header, wrong retry policy) only show up when the seam is real.

### E2E — the golden paths only

Use for the handful of user flows that pay the bills: signup, checkout, the one workflow that would page you at 3am if it broke. Few, high-value, slow.

Tooling options, roughly in order of preference for CI:

- **Playwright** — the standard for CI. Deterministic, headless, integrates with GH Actions. Use this for the E2E cases that gate merges.
- **Cypress** — friendlier local DX, similar CI story.
- **Claude Chrome extension** — Anthropic's browser extension lets Claude drive your live Chrome to walk through a flow, click things, observe results.
  - **Good for**: exploratory testing ("did the change I just built actually work end-to-end?" before committing), verifying a flow that doesn't yet have a written Playwright case, one-off runs, adapting to selector changes without rewrites.
  - **Not good for**: replacing Playwright in CI. It is not deterministic, not reproducible turn-to-turn, needs a live Chrome + your session, and costs API calls per run. Do not gate merges on it.
  - When a case would benefit from being walked through this way *before* the Playwright version is written, note it in the plan.

**Not E2E-worthy**: every branch of every form. That's an integration test hiding in an E2E hat. If it doesn't need the full browser stack, drop it a level.

## Output shape

Short markdown, no template ceremony:

```markdown
# Test Plan: [change name]

**What it does**: [one sentence]

## Cases
- [unit] happy: valid input → returns X
- [unit] rejects malformed body → 400 with field-level error
- [integration] token expired → 401, no DB write
- [integration] downstream 503 → returns 503 to caller, does not retry
- [e2e] user completes checkout → order row in DB, receipt email queued
  _Walk through with Claude Chrome extension before writing the Playwright case._
- [regression] existing GET /users still returns unchanged shape

## Not testing
- Fastify JSON parsing (framework)
- Third-party JWT library internals (mocked at boundary)
- Every combinatoric field of the form (integration + property test if it matters)
```

## Rules

- **Assertions, not intentions.** "Handles bad input" is not a test case. "Returns 400 when `email` is missing" is.
- **One case per line.** If a bullet needs an "and," split it.
- **Don't design the tests, name them.** The plan is a checklist, not code. If you can't name the case in one line, the case isn't clear enough.
- **A plan with only happy-path cases is a bad plan.** If you can't think of a failure mode, ask the user what the failure modes are. That's the whole reason this skill exists.
- **Never pick "unit" for a case that needs a mock.** Move it to integration and run it against the real thing.
- **Coverage percentage is a vanity metric.** The number that matters is how many prod incidents your tests catch before deploy. Optimize for that.
