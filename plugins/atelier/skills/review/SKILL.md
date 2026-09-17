---
name: review
description: Explicit-invocation-only orchestrator that runs code review + security review + design review against the built code, using `.design/YYYY-MM-DD-<slug>/` as the source of intent when one exists — and reviewing the diff on its own merits when it doesn't. Invoked ONLY when the user types /review or explicitly asks to "run the review pipeline", "review the build", or "check the feature". For a single technical review only, use `code-review` directly. For a single visual review only, use `design-review` directly. DO NOT auto-trigger from adjacent talk about reviewing code — those have their own skills.
---

This skill is the **review** orchestrator. It runs three reviews — technical, security, then visual — against the code produced by `/build`, using the docs from `.design/YYYY-MM-DD-<slug>/` as the yardstick.

The three-part pipeline:
- `/design` — produces docs in `.design/YYYY-MM-DD-<slug>/`.
- `/build`  — reads those docs, writes the code.
- `/review` — this skill. Reviews the code against the docs.

## Prerequisites

**Required:** code changes to review — uncommitted, a branch diff, or files the user names. If there's no diff and no target, ask which files to review.

**Optional:** `.design/YYYY-MM-DD-<slug>/` with `DESIGN_BRIEF.md`. It is the yardstick for *intent*, not a gate. Most branches don't have one, and a branch without a brief still deserves a review.

**No design folder: ask, then do what they say.** Do not start a degraded review on your own judgment — the user may have meant a different slug, or may want `/design` first. State what you found and ask one question:

> No design folder for this branch. Review the diff on its own? Plan-gap and plan-drift checks get skipped — nothing to measure intent against.

**They say yes** — run the review as described below. **They say no, or name a slug** — use it. Ask once; do not re-raise it at each phase.

Once they say yes, run:

- **Phase 1 (code review):** everything except plan gap and plan drift, which have nothing to measure against. The conventions (`errors`, `logging`) still bind — those live in the skills, not in the brief, so they are checked either way.
- **Phase 2 (security):** unaffected. Never skipped.
- **Phase 3 (design review):** only if the diff touches UI. With no brief or tokens spec, measure against the codebase's own tokens, components, and patterns — consistency with what's already there, plus the universals: responsive behavior, accessibility, contrast, focus states, error copy. Say you reviewed against the codebase rather than a brief.

Write reports into the feature's existing design folder, under the name it already has. Otherwise put them in the scratchpad (or wherever the user says) and hand back the paths — do not create a `.design/` folder just to have somewhere to write.

**Name what you could not check.** A review missing its plan-gap pass must say so, in the report, not just in chat. A report that silently omits a check reads exactly like one that ran it and found nothing — and that reader is usually future-you.

If the branch obviously wanted a brief that nobody wrote, say so inside the question, not after the review. That is the point where it can still change the answer.

## The Sequence

```
1. Code Review      → .design/YYYY-MM-DD-<slug>/CODE_REVIEW.md              (correctness / tests / clarity)
2. Security Review  → .design/YYYY-MM-DD-<slug>/SECURITY_REVIEW.md          (dedicated security pass)
3. Design Review    → .design/YYYY-MM-DD-<slug>/DESIGN_REVIEW.md + screenshots  (visual / aesthetic / responsive)
```

All three phases read from the same `.design/YYYY-MM-DD-<slug>/` folder and write their reports back into it.

## Operating Rules

1. **Open with a scan.** Ask (or infer) which feature slug this review is for, then find its folder by globbing `.design/*<slug>*/` — matching both dated `.design/YYYY-MM-DD-<slug>/` folders and legacy undated `.design/<slug>/` ones. Several match: take the most recent date and say which one you picked. List what's in it — or say there is no design folder and this is a diff-only review. Show a git diff summary (files changed, lines added/removed). Ask which phases to run — usually all three, but any subset is fine.

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This checks [what]. Ready?" Wait for confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.**

4. **Thread the design docs into each phase.**
   - Before phase 1, hand `code-review` the brief, backend brief, `TASKS.md`, `TEST_PLAN.md`, and the PRD, so it can flag drift from spec (an endpoint shape that doesn't match `BACKEND_DESIGN.md`), plan gaps (a task ticked with nothing implementing it), and plan drift (code no task asked for). `code-review` loads the `errors` and `logging` conventions itself — the same two `/build` wrote against — so the error and log contract is checked, not assumed.
   - Before phase 2, hand `design-review` the brief and tokens spec so it can measure the built UI against the named philosophy and token roles.

5. **End each phase with a checkpoint.** Summarize the report filename, count of findings by severity, and the biggest single issue. Then ask: "Address any must-fix items now, or continue?"

6. **Never silently skip the security phase.** If `security-review` is unavailable, say so plainly — "the `security-review` skill isn't available here, so this ran without a dedicated security pass" — and tell the user to update Claude Code or enable it. A review that quietly omits security reads identical to one that ran it and found nothing, which is the worst possible outcome for the reader.

7. **Close the loop.** After the last phase, tell the user: "Reviews saved to `.design/YYYY-MM-DD-<slug>/`. Address must-fix items now, or capture them as follow-ups."

## Phase Details

### Phase 1: Code Review

Read `code-review/SKILL.md` and follow it. Point it at the branch diff (or uncommitted changes, or user-named files). Give it the brief + backend brief for context so it can flag both bugs AND drift from spec.
- **Input**: git diff + `.design/YYYY-MM-DD-<slug>/DESIGN_BRIEF.md` + `BACKEND_DESIGN.md` + `TASKS.md` + `TEST_PLAN.md` (whichever exist) + the PRD if `docs/prd/` has one + the `errors` and `logging` conventions. `TASKS.md` matters as much as the diff here — its checkboxes and `Implemented` lines are what gaps and drift are measured against.
- **Produces**: `.design/YYYY-MM-DD-<slug>/CODE_REVIEW.md` with categorized findings (must-fix, should-fix, consider).
- **Transition**: "Code review done. Next: the dedicated security pass."

### Phase 2: Security Review

Run Claude Code's built-in `security-review` skill against the same changes. This is a **dedicated pass, not a duplicate** of phase 1: `code-review`'s security checklist is a generalist sweep performed by a reviewer also thinking about naming and tests, while `security-review` looks at nothing else. The two find different things, and the overlap is cheap.

- **Input**: the same diff phase 1 reviewed — pending changes on the current branch.
- **Produces**: `.design/YYYY-MM-DD-<slug>/SECURITY_REVIEW.md`. Save the findings there even though the skill reports inline, so the report sits with the others and a later fix pass can work from a file. **Number them `SEC-1`, `SEC-2` as you save** — `security-review` does not assign ids, and a fix pass needs them for the same reason `CR-n` and `DR-n` exist.
- **If the skill is unavailable**: do not substitute your own security opinion for it and do not skip quietly. Report it under rule 6, note that phase 1's security checklist was the only coverage, and continue.
- **Transition**: "Security review done. Next: the design review?"

### Phase 3: Design Review

Read `design-review/SKILL.md` and follow it. Tell it to compare against `DESIGN_BRIEF.md` and to use the philosophy + component inventory from there, plus the tokens spec. Screenshots via Playwright MCP, Cursor IDE Browser, or by asking the user.
- **Input**: built code + `DESIGN_BRIEF.md` + `DESIGN_TOKENS.md` + `INFORMATION_ARCHITECTURE.md`.
- **Produces**: `.design/YYYY-MM-DD-<slug>/DESIGN_REVIEW.md` + `.design/YYYY-MM-DD-<slug>/screenshots/`.
- **Transition**: "Both reviews complete. Must-fix items can be addressed now, or captured as follow-ups."

## Project Files Structure (after review)

```
.design/
└── YYYY-MM-DD-<feature-slug>/
    ├── DESIGN_BRIEF.md              ← from /design
    ├── BACKEND_DESIGN.md            ← from /design
    ├── INFORMATION_ARCHITECTURE.md  ← from /design
    ├── DESIGN_TOKENS.md             ← from /design (spec)
    ├── TASKS.md                     ← from /design
    ├── CODE_REVIEW.md               ← Phase 1
    ├── SECURITY_REVIEW.md           ← Phase 2
    ├── DESIGN_REVIEW.md             ← Phase 3
    └── screenshots/                 ← Phase 3
```

## What This Skill Is Not

- Not a designer or builder — those are `/design` and `/build`.
- Not a substitute for running `code-review` or `design-review` alone when you only need one of them.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.

## Done when

- Every phase the user did not skip produced its report in `.design/YYYY-MM-DD-<slug>/`
- The plan was checked against the code both ways — nothing the plan asked for is missing, nothing built went unasked
- The security phase ran, or you said plainly that it could not
- Nothing was edited — this skill reports only

**Then hand off.** Say: "Reviews saved to `.design/YYYY-MM-DD-<slug>/`." Give the finding counts per report and the single biggest issue, then: "Next: address the must-fix items, or capture them as follow-ups." 
