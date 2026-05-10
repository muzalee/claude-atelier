---
name: review
description: Explicit-invocation-only orchestrator that runs code review + design review against the built code, using `.design/<slug>/` as the source of intent. Invoked ONLY when the user types /review or explicitly asks to "run the review pipeline", "review the build", or "check the feature". For a single technical review only, use `code-review` directly. For a single visual review only, use `design-review` directly. DO NOT auto-trigger from adjacent talk about reviewing code — those have their own skills.
---

This skill is the **review** orchestrator. It runs the two reviews — technical, then visual — against the code produced by `/build`, using the docs from `.design/<slug>/` as the yardstick.

The three-part pipeline:
- `/design` — produces docs in `.design/<slug>/`.
- `/build`  — reads those docs, writes the code.
- `/review` — this skill. Reviews the code against the docs.

## Prerequisites

Both are needed:
- `.design/<slug>/` with at minimum `DESIGN_BRIEF.md` (the intent to measure against).
- Code changes to review — either uncommitted, on a branch diff, or in files the user names.

If there's no design folder, tell the user to run `/design` first (or point at a brief). If there's no diff, ask which files to review.

## The Sequence

```
1. Code Review    → .design/<slug>/CODE_REVIEW.md            (correctness / security / tests / clarity)
2. Design Review  → .design/<slug>/DESIGN_REVIEW.md + screenshots  (visual / aesthetic / responsive)
```

Both phases read from the same `.design/<slug>/` folder and write their reports back into it.

## Operating Rules

1. **Open with a scan.** Ask (or infer) which feature slug this review is for. List what's in `.design/<slug>/`. Show a git diff summary (files changed, lines added/removed). Ask which phases to run — usually both, but code-only or design-only is fine.

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This checks [what]. Ready?" Wait for confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.**

4. **Thread the design docs into each phase.**
   - Before phase 1, hand `code-review` the brief and backend brief so it can flag drift from spec (e.g. an endpoint shape that doesn't match the API surface in `BACKEND_DESIGN.md`).
   - Before phase 2, hand `design-review` the brief and tokens spec so it can measure the built UI against the named philosophy and token roles.

5. **End each phase with a checkpoint.** Summarize the report filename, count of findings by severity, and the biggest single issue. Then ask: "Address any must-fix items now, or continue?"

6. **Close the loop.** After phase 2, tell the user: "Both reviews saved to `.design/<slug>/`. Address must-fix items now, or capture them as follow-ups."

## Phase Details

### Phase 1: Code Review

Read `code-review/SKILL.md` and follow it. Point it at the branch diff (or uncommitted changes, or user-named files). Give it the brief + backend brief for context so it can flag both bugs AND drift from spec.
- **Input**: git diff + `.design/<slug>/DESIGN_BRIEF.md` + `.design/<slug>/BACKEND_DESIGN.md` (if present).
- **Produces**: `.design/<slug>/CODE_REVIEW.md` with categorized findings (must-fix, should-fix, consider).
- **Transition**: "Code review done. Address any must-fix items now, or move on to the design review?"

### Phase 2: Design Review

Read `design-review/SKILL.md` and follow it. Tell it to compare against `DESIGN_BRIEF.md` and to use the philosophy + component inventory from there, plus the tokens spec. Screenshots via Playwright MCP, Cursor IDE Browser, or by asking the user.
- **Input**: built code + `DESIGN_BRIEF.md` + `DESIGN_TOKENS.md` + `INFORMATION_ARCHITECTURE.md`.
- **Produces**: `.design/<slug>/DESIGN_REVIEW.md` + `.design/<slug>/screenshots/`.
- **Transition**: "Both reviews complete. Must-fix items can be addressed now, or captured as follow-ups."

## Project Files Structure (after review)

```
.design/
└── <feature-slug>/
    ├── DESIGN_BRIEF.md              ← from /design
    ├── BACKEND_DESIGN.md            ← from /design
    ├── INFORMATION_ARCHITECTURE.md  ← from /design
    ├── DESIGN_TOKENS.md             ← from /design (spec)
    ├── TASKS.md                     ← from /design
    ├── CODE_REVIEW.md               ← Phase 1
    ├── DESIGN_REVIEW.md             ← Phase 2
    └── screenshots/                 ← Phase 2
```

## What This Skill Is Not

- Not a designer or builder — those are `/design` and `/build`.
- Not a substitute for running `code-review` or `design-review` alone when you only need one of them.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.
