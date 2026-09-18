---
name: test-plan
description: Write a short test plan before implementing — the cases that must pass, the level each lives at (unit / integration / e2e), what to break to prove them, and what NOT to test. Fills `## Tests` in the feature's `.design/YYYY-MM-DD-<slug>.md` when one exists, otherwise prints inline. Use before non-trivial work, when asked for a "test plan", or to sanity-check a PR's coverage.
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

6. **Write the plan into `## Tests`.** Find the feature's design file by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file**. Write the cases into that file's `## Tests` section; in a legacy six-file folder, write `TEST_PLAN.md` beside the old files as before. Do not create a design file just to have somewhere to write — with none, output inline.

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

Two tables, no template ceremony: the cases, then what you are not testing. **Reference the interactions named in `## Experience` and the failure modes named in `## Architecture` rather than describing them again** — a case that re-tells the interaction is the same decision written twice. The `From` column is where that reference goes.

```markdown
## Tests

| Level | Case | Assertion | From |
| ----- | ---- | --------- | ---- |
| unit | happy path | valid input → returns X | FR-1 |
| unit | malformed body | 400 with field-level error | FR-2 |
| integration | token expired | 401, no DB write | Auth |
| integration | downstream 503 | returns 503 to caller, does not retry | Failure modes |
| e2e | checkout completes | order row in DB, receipt email queued — walk it with the Chrome extension before writing the Playwright case | Checkout (interaction) |
| regression | existing `GET /users` | response shape unchanged | — |

### Not testing

| What | Why |
| ---- | --- |
| Fastify JSON parsing | Framework behavior |
| JWT library internals | Mocked at the boundary |
| Every field combination of the form | Integration + property test if it matters |
```

## Rules

- **Assertions, not intentions.** "Handles bad input" is not a test case. "Returns 400 when `email` is missing" is.
- **One case per row.** If a case needs an "and," split it.
- **Don't design the tests, name them.** The plan is a table, not code. If you can't name the case in one row, the case isn't clear enough.
- **A plan with only happy-path cases is a bad plan.** If you can't think of a failure mode, ask the user what the failure modes are. That's the whole reason this skill exists.
- **Never pick "unit" for a case that needs a mock.** Move it to integration and run it against the real thing.
- **Coverage percentage is a vanity metric.** The number that matters is how many prod incidents your tests catch before deploy. Optimize for that.

## Read before writing

The failure modes worth testing live in the design file, not in your imagination. Where one exists, read first:

- **`## Experience`** — the key interactions are the e2e cases, and the out-of-scope column of `## Scope` — or the PRD's non-goals, when there is a PRD — tells you what not to cover.
- **`## Architecture`** — the invariants and failure modes are the integration cases. The failure modes list is close to a test list already.
- **`docs/prd/NNNN-*.md`** — every `FR-n` and `NFR-n` is a requirement someone agreed to. A MUST with no test is a shippable bar nothing checks.

Cite what each case comes from. A case traced to `FR-3` or to a named failure mode survives the argument about whether it is worth writing; one that came from nowhere does not.

## Done when

- The plan names each case, the level it lives at, and what to break to prove it
- Cases trace back to an interaction in `## Experience`, a failure mode in `## Architecture`, or a PRD requirement id — by reference, not by restating them
- It says what NOT to test, so the build does not gold-plate coverage
- Written into `## Tests` in `.design/YYYY-MM-DD-<slug>.md` when a design file exists, inline when none does

**Then hand off.** Say: "Tests written to `.design/YYYY-MM-DD-<slug>.md`." Then: "Next: **`/atelier:brief-to-tasks`** to turn all of this into an ordered build checklist."
