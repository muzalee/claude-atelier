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

4. **Thread the design docs and the conventions into each phase.** Explicitly hand file paths so the sub-skill doesn't hunt for context, and name which house conventions apply — a sub-skill that isn't told will build to its own defaults.

5. **End each phase with a one-line status.** "Phase N done: N files, tests green." Then move to the next phase without asking.

6. **Only stop on real blockers.** A blocker is: the design docs contradict the codebase in a way the brief didn't resolve, a required dependency isn't available and the fallback isn't obvious, a migration would be destructive to existing data, or a check fails and the fix isn't within scope. Chatty check-ins are not blockers — the design phase already answered "should we do this?".

7. **The PRD is scope, not a suggestion.** If `.design/<slug>/` or `docs/prd/` names a PRD, read it. When the build has to deviate from a stated requirement — a MUST turns out to be infeasible, a non-goal turns out to be unavoidable — that is a real blocker under rule 6. Stop, name the requirement ID, and offer to amend the PRD (read `prd/SKILL.md`, Amend mode). Shipping code that contradicts the PRD is how the document dies.

8. **House conventions bind the code you write.** Before writing anything, load the conventions that apply to this repo (see [House Conventions](#house-conventions) below) and follow them. They are not suggestions to weigh against convenience — they are the standards the review phase measures against, so code that ignores them comes back as findings and gets written twice.

9. **No historical comments.** Comments describe what the code does now, never how it got here. No `// changed from X`, no `// previously did Y`, no `// added per review feedback`, no commented-out old implementation left "just in case". Git already records history accurately and searchably; a comment claiming it is unverifiable, and it starts rotting the moment someone edits nearby. This matters most when `/ship` or a review-fix pass is driving the build, because that is exactly when the temptation to annotate the change is strongest.

10. **Close the loop.** After the last phase, one summary: what was built, tests status, anything deferred. Then: "Build done. Run `/review` to check the code against the design."

## House Conventions

Load these before writing code. Each is a real skill — read its `SKILL.md` and follow it, do not work from the summary here.

**Always, in every repo:**

| Skill | Applies to |
| ----- | ---------- |
| `errors` | Every error you throw, wrap, or handle. Typed errors with stable codes and cause chains, thrown not returned. |
| `logging` | Every log line. Structured, carrying trace-id and operation name, correct level, no secrets or PII. |
| `keep-it-simple` | Commit messages, branch names, code comments, and any docs written along the way. |

**When the stack matches**, detect and load the stack-specific conventions:

| Detect | Load |
| ------ | ---- |
| `tsconfig.json` present, or `.ts`/`.tsx` files in the repo, **and** the `atelier-typescript` plugin is installed | `typescript-conventions` — then the React half for frontend work, the Fastify half for backend work |
| Fastify in `package.json` and you are adding an endpoint | `fastify-route` for the route's shape |

If the repo is TypeScript but `atelier-typescript` is not installed, say so once in the opening scan — "TypeScript repo, but `atelier-typescript` isn't installed, so I'm building without the house TS conventions" — and continue. Do not stall on it, and do not invent the conventions from memory.

Where a skill's convention and the existing codebase disagree, **the codebase wins** and you say so in one line. One consistent idiom beats one correct idiom plus one legacy idiom, because every future reader then has to know which files follow which.

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
