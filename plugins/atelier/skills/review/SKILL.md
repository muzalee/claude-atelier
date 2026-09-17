---
name: review
description: Explicit-invocation-only orchestrator that runs code review + security review + design review against the built code, using `.design/YYYY-MM-DD-<slug>.md` as the source of intent when one exists — and reviewing the diff on its own merits when it doesn't. Findings are printed, not filed. Invoked ONLY when the user types /review or explicitly asks to "run the review pipeline", "review the build", or "check the feature". For a single technical review only, use `code-review` directly. For a single visual review only, use `design-review` directly. DO NOT auto-trigger from adjacent talk about reviewing code — those have their own skills.
---

This skill is the **review** orchestrator. It runs three reviews — technical, security, then visual — against the code produced by `/build`, using `.design/YYYY-MM-DD-<slug>.md` as the yardstick.

**Reviews print their findings and write no files.** Every finding carries a stable id so a fix pass can report against it; the record of what was fixed lands in the design file's `## Implementation` section, written by the fix pass, not here. This skill edits nothing.

The three-part pipeline:
- `/design` — produces `.design/YYYY-MM-DD-<slug>.md`.
- `/build`  — reads it, writes the code.
- `/review` — this skill. Reviews the code against it.

## Prerequisites

**Required:** code changes to review — uncommitted, a branch diff, or files the user names. If there's no diff and no target, ask which files to review.

**Optional:** `.design/YYYY-MM-DD-<slug>.md`. It is the yardstick for *intent*, not a gate. Most branches don't have one, and a branch without a design still deserves a review.

**No design file: ask, then do what they say.** Do not start a degraded review on your own judgment — the user may have meant a different slug, or may want `/design` first. State what you found and ask one question:

> No design file for this branch. Review the diff on its own? Plan-gap and plan-drift checks get skipped — nothing to measure intent against.

**They say yes** — run the review as described below. **They say no, or name a slug** — use it. Ask once; do not re-raise it at each phase.

Once they say yes, run:

- **Phase 1 (code review):** everything except plan gap and plan drift, which have nothing to measure against. The conventions (`errors`, `logging`) still bind — those live in the skills, not in the brief, so they are checked either way.
- **Phase 2 (security):** unaffected. Never skipped.
- **Phase 3 (design review):** only if the diff touches UI. With no design file, measure against the codebase's own tokens, components, and patterns — consistency with what's already there, plus the universals: responsive behavior, accessibility, contrast, focus states, error copy. Say you reviewed against the codebase rather than a design.

**Name what you could not check**, out loud, next to the findings. A review that silently omits a check reads exactly like one that ran it and found nothing — and that reader is usually future-you.

If the branch obviously wanted a brief that nobody wrote, say so inside the question, not after the review. That is the point where it can still change the answer.

## The Sequence

```
1. Code Review      → CR-n findings, printed     (correctness / tests / clarity)
2. Security Review  → SEC-n findings, printed    (dedicated security pass)
3. Design Review    → DR-n findings, printed     (visual / aesthetic / responsive)
```

All three read the same `.design/YYYY-MM-DD-<slug>.md` for intent and write nothing back to it. The fix pass writes `## Implementation`; this skill only reports.

## Operating Rules

1. **Open with a scan.** Ask (or infer) which feature slug this review is for. Find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). List which sections are filled — or say there is no design file and this is a diff-only review. Show a git diff summary (files changed, lines added/removed). Ask which phases to run — usually all three, but any subset is fine.

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This checks [what]. Ready?" Wait for confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.**

4. **Thread the design docs into each phase.**
   - Before phase 1, hand `code-review` the design file and the PRD, so it can flag drift from spec (an endpoint shape that doesn't match `## Architecture`), plan gaps (a task ticked with nothing implementing it), and plan drift (code no task asked for). `## Implementation` matters as much as `## Tasks` here. `code-review` loads the `errors` and `logging` conventions itself — the same two `/build` wrote against — so the error and log contract is checked, not assumed.
   - Before phase 3, hand `design-review` the `## Experience` and `## Tokens` sections so it can measure the built UI against the named philosophy and token roles.

5. **End each phase with a checkpoint.** Give the count of findings by severity and the biggest single issue. Then ask: "Address any must-fix items now, or continue?"

6. **Never silently skip the security phase.** If `security-review` is unavailable, say so plainly — "the `security-review` skill isn't available here, so this ran without a dedicated security pass" — and tell the user to update Claude Code or enable it. A review that quietly omits security reads identical to one that ran it and found nothing, which is the worst possible outcome for the reader.

7. **Close the loop.** After the last phase, give the finding counts per phase and tell the user: "Address must-fix items now, or capture them as follow-ups." Findings live in this transcript and in the ids — anything fixed gets recorded in `## Implementation` by the fix pass, which is `/build`'s job, not this skill's.

## Phase Details

### Phase 1: Code Review

Read `code-review/SKILL.md` and follow it. Point it at the branch diff (or uncommitted changes, or user-named files). Give it the design file for context so it can flag both bugs AND drift from spec.
- **Input**: git diff + `.design/YYYY-MM-DD-<slug>.md` (whichever sections are filled) + the PRD if `docs/prd/` has one + the `errors` and `logging` conventions. `## Tasks` and `## Implementation` matter as much as the diff here — the ticked boxes and the implementation lines are what gaps and drift are measured against.
- **Produces**: `CR-n` findings, printed, categorized must-fix / should-fix / consider. No file.
- **Transition**: "Code review done: N must-fix, N should-fix. Next: the dedicated security pass."

### Phase 2: Security Review

Run Claude Code's built-in `security-review` skill against the same changes. This is a **dedicated pass, not a duplicate** of phase 1: `code-review`'s security checklist is a generalist sweep performed by a reviewer also thinking about naming and tests, while `security-review` looks at nothing else. The two find different things, and the overlap is cheap.

- **Input**: the same diff phase 1 reviewed — pending changes on the current branch.
- **Produces**: `SEC-n` findings, printed. **Number them `SEC-1`, `SEC-2` as they come back** — `security-review` does not assign ids, and a fix pass needs them for the same reason `CR-n` and `DR-n` exist.
- **If the skill is unavailable**: do not substitute your own security opinion for it and do not skip quietly. Report it under rule 6, note that phase 1's security checklist was the only coverage, and continue.
- **Transition**: "Security review done: N findings. Next: the design review?"

### Phase 3: Design Review

Read `design-review/SKILL.md` and follow it. Tell it to compare against `## Experience` — the philosophy and the component list — plus `## Tokens`. Browser via Orca, Playwright MCP, Claude-in-Chrome, or by asking the user.
- **Input**: built code + `## Experience` + `## Tokens` + `## Structure`.
- **Produces**: `DR-n` findings, printed. Screenshots are looked at during the session and saved nowhere.
- **Transition**: "All three reviews complete. Must-fix items can be addressed now, or captured as follow-ups."

## What this leaves behind

Nothing. No `CODE_REVIEW.md`, no `SECURITY_REVIEW.md`, no `DESIGN_REVIEW.md`, no screenshots folder. The findings are in this transcript with stable ids; what gets fixed is recorded in the design file's `## Implementation` section by the fix pass, and what stays open goes in the PR body under Known findings when there is a PR.

A finding worth keeping is one that was either fixed and recorded, or named in the PR. A report file is a third copy that nobody updates.

## What This Skill Is Not

- Not a designer or builder — those are `/design` and `/build`.
- Not a substitute for running `code-review` or `design-review` alone when you only need one of them.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.

## Done when

- Every phase the user did not skip ran and printed its findings, each with a stable id
- The plan was checked against the code both ways — nothing the plan asked for is missing, nothing built went unasked
- The security phase ran, or you said plainly that it could not
- Nothing was written or edited — this skill reports only

**Then hand off.** Give the finding counts per phase and the single biggest issue, then: "Next: fix the must-fix items with **`/atelier:build`** — it records each one in `## Implementation` — or capture them as follow-ups."
