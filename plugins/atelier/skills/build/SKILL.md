---
name: build
description: Explicit-invocation-only orchestrator that reads a completed `.design/<slug>/` folder and implements the code — frontend + backend — autonomously, without per-phase confirmation. All decisions were made in `/design`; this skill executes them. Invoked ONLY when the user types /build or explicitly asks to "build from the design", "implement the design", "code the feature from the brief", or "run the build pipeline". DO NOT auto-trigger from adjacent talk about writing frontend or backend code — those have their own skills. Requires a `.design/<slug>/` folder from a prior `/design` run.
---

This skill is the **build** orchestrator. It takes the design docs produced by `/design` and turns them into working code. Two phases, executed back-to-back without confirmation gates — the design phase was the interactive one, this phase just delivers.

The three-part pipeline:
- `/design` — produces docs in `.design/<slug>/`.
- `/build`  — this skill. Reads those docs, writes the code.
- `/review` — reviews the code against the docs.

## Prerequisite

`.design/<slug>/` must exist with at minimum `DESIGN_BRIEF.md`. If it doesn't, stop and tell the user to run `/design` first. This skill needs a brief, tasks, and (optionally) a backend brief + tokens spec — not a vibe.

## The Sequence

```
1. Frontend Build → materialize tokens spec + implement frontend from TASKS.md
2. Backend Build  → implement server from BACKEND_DESIGN.md
```

Skip either phase if the design didn't include it (e.g. no `BACKEND_DESIGN.md` → skip phase 2).

## Operating Rules

1. **Open with a scan, then proceed.** Auto-detect the slug: if exactly one folder exists under `.design/`, use it; if several, ask once which one. List the artifacts present in `.design/<slug>/` and state which phases will run (frontend if `TASKS.md` exists, backend if `BACKEND_DESIGN.md` exists — skip absent ones). Do not ask permission — the user asked for a build.

2. **Announce each phase as you enter it, then execute.** Format: "Phase N: [name]. Building now." No wait, no confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.** Do not paraphrase.

4. **Thread the design docs into each phase.** Explicitly hand file paths so the sub-skill doesn't hunt for context.

5. **End each phase with a one-line status.** "Phase N done: N files, tests green." Then move to the next phase without asking.

6. **Only stop on real blockers.** A blocker is: the design docs contradict the codebase in a way the brief didn't resolve, a required dependency isn't available and the fallback isn't obvious, a migration would be destructive to existing data, or a check fails and the fix isn't within scope. Chatty check-ins are not blockers — the design phase already answered "should we do this?".

7. **Close the loop.** After the last phase, one summary: what was built, tests status, anything deferred. Then: "Build done. Run `/review` to check the code against the design."

## Phase Details

### Phase 1: Frontend Build

**Before running `frontend-design`, materialize the token spec if needed.**

If `.design/<slug>/DESIGN_TOKENS.md` exists AND the project has no existing token file (no `tokens.css`, no populated `theme.extend`, no `theme.ts` from a prior pass), translate the spec into the project's stack-appropriate format:

- Tailwind project → extend `tailwind.config.js` (colors, spacing, fontFamily, etc.) AND write CSS variables to `globals.css` for anything that needs runtime theming.
- Plain CSS/HTML → write to `tokens.css`, imported by the root stylesheet.
- CSS-in-JS (Material UI / Chakra / Emotion) → write to `theme.ts` or `theme.js` in the expected shape for the library.
- Default when unclear → CSS custom properties in `tokens.css`.

Read the token names, values, and semantic roles directly from `DESIGN_TOKENS.md`. Do not re-derive from the philosophy — the spec already made those decisions. Announce the file created in one line, then proceed.

Then read `frontend-design/SKILL.md` and follow it. Work through the frontend tasks in `TASKS.md` in order. After each task, check it off in `TASKS.md` and continue to the next without asking.

- **Input**: `TASKS.md`, `DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md`, materialized token file.
- **Produces**: frontend components + pages + (if materialized this pass) the token file.
- **Transition**: "Frontend done. Next: implement the backend from `BACKEND_DESIGN.md`. Skip if there's no server work. Continue?"

### Phase 2: Backend Build

Read `backend-build/SKILL.md` and follow it. Hand it `.design/<slug>/BACKEND_DESIGN.md` as the source of truth.

- **Input**: `BACKEND_DESIGN.md` + existing codebase.
- **Produces**: server code (routes, plugins, migrations, tests) — build + tests passing.
- **Transition**: "Backend built and tests green. Run `/review` next to check the code."

## What This Skill Is Not

- Not a designer — this skill writes code. `/design` produces the docs it consumes.
- Not a reviewer — `/review` does the technical + visual review after the build.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.
- Not a chatty pipeline — decisions were made in `/design`. This orchestrator executes, only stopping on real blockers (see rule 6).
