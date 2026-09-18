---
name: build
description: Explicit-invocation-only orchestrator that implements a completed `.design/YYYY-MM-DD-<slug>.md` — frontend, then backend — with a go/no-go between phases unless told "go all". Decisions were made in `/design`; this executes them. Use ONLY on /build or an explicit "build from the design", "implement the design", or "run the build pipeline". DO NOT auto-trigger from talk about writing frontend or backend code — those have their own skills. With no design file it asks: build directly, or `/design` first.
---

This skill is the **build** orchestrator. It takes the design produced by `/design` and turns it into working code. Two phases, with a go/no-go between them unless the caller says to run them all.

The three-part pipeline:
- `/design` — produces `.design/YYYY-MM-DD-<slug>.md`.
- `/build`  — this skill. Reads it, writes the code.
- `/review` — reviews the code against it.

## Prerequisite

`.design/YYYY-MM-DD-<slug>.md` with at minimum `## Problem`, `## Solution` and `## Tasks` filled is what this skill is built for.

**No design file: ask, then do what they say.** Do not decide this on your own, in either direction — not by refusing, and not by judging the change small enough to wave through. The user knows whether this needs a plan; you are guessing.

State what you would build and ask one question:

> No design file here. Build the token change directly, without a plan? Or run `/design` first to settle it properly.
>
> Building direct: no task list, no recorded decisions, and `/review` will have nothing to check the result against.

Then:

- **They say build** — build it. That is the answer, whatever the size. Say in one line what you are building, load the [House Conventions](#house-conventions), do the work, run the tests. Skip the `## Implementation` bookkeeping: there is no design file to record against, and the diff plus the commit message carry it.
- **They say design** — hand off to `/design` and stop.

Ask once. Do not re-raise it later in the same build, and do not re-litigate a "just build it" by warning about it again.

**Name the unmade decisions in the question when there are any.** "This needs a data model and an auth story that nothing has settled" is the information that makes their answer a real choice rather than a rubber stamp. Say it in the question, not after they answer.

The conventions bind either way — they live in the skills, not in the brief, and unplanned changes are exactly where error and log discipline gets quietly skipped.

## The Sequence

```
1. Frontend Build → materialize the ### Tokens spec + implement the frontend from ## Tasks
2. Backend Build  → implement the server from ## Architecture
```

Skip either phase if the design didn't include it (e.g. `## Architecture` says "No server work" → skip phase 2).

## Operating Rules

1. **Open with a scan, then start.** Find the feature's design file by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file**. Name the file you picked, list which sections are filled, and state which phases will run (frontend if `## Tasks` has frontend work, backend if `## Architecture` has server work — skip the absent ones). This skill never creates or renames a design file.

   No `.design/` at all: ask the Prerequisite question and wait. The scan is still worth doing first — say which files the ask touches and which decisions are unsettled, so the question is one they can actually answer.

2. **Announce the phase, run it, then ask before the next one.** Format: "Phase N: [name]. Building now." Run it end to end. Then stop and ask: **"Next phase: [name]. Go?"** — the same checkpoint shape `/design` uses. Do not enter phase N+1 until they answer.

   **Unless gates are off.** If the user says **"go all"** — or invokes `/build --all`, or says "run everything", "no gates", "unattended" — skip every gate for the rest of the run and say once, in one line, that gates are off. Do not ask again, and do not re-confirm at the last phase.

   **Why both modes exist, so neither side drifts.** A gated build inside an unattended run stops at phase 1 waiting for a human who is not there; `/ship`'s stage 3 reads that prompt as a question, and its rule 2 halts the whole run. The gate and the unattended pipeline are mutually exclusive **by construction** — so whichever skill spawns this build owns saying which mode it is, in the instruction text itself. An orchestrator that expects to be recognized as an orchestrator gets a gate.

   Gates are go/no-go, not design review. "Go?" means "shall I run the next phase", not "let us reopen the brief". If the answer is a new decision rather than a yes, that is a blocker under rule 6.

3. **Run each phase by reading its SKILL.md and following it in full.** Do not paraphrase.

4. **Thread the design docs and the conventions into each phase.** Explicitly hand file paths so the sub-skill doesn't hunt for context, and name which house conventions apply — a sub-skill that isn't told will build to its own defaults.

5. **End each phase with a one-line status.** "Phase N done: N files, tests green." Then the gate from rule 2 — or straight on, when gates are off.

6. **Only stop on real blockers.** A blocker is: the design docs contradict the codebase in a way the brief didn't resolve, a required dependency isn't available and the fallback isn't obvious, a migration would be destructive to existing data, or a check fails and the fix isn't within scope. Chatty check-ins are not blockers — the design phase already answered "should we do this?".

7. **The PRD is scope, not a suggestion.** If `.design/YYYY-MM-DD-<slug>.md` or `docs/prd/` names a PRD, read it. When the build has to deviate from a stated requirement — a MUST turns out to be infeasible, a non-goal turns out to be unavoidable — that is a real blocker under rule 6. Stop, name the requirement ID, and offer to amend the PRD (read `${CLAUDE_SKILL_DIR}/../prd/SKILL.md`, Amend mode). Shipping code that contradicts the PRD is how the document dies.

8. **House conventions bind the code you write.** Before writing anything, load the conventions that apply to this repo (see [House Conventions](#house-conventions) below) and follow them. They are not suggestions to weigh against convenience — they are the standards the review phase measures against, so code that ignores them comes back as findings and gets written twice.

9. **Record what you implemented in `## Implementation` as you go.** Ticking a box in `## Tasks` says a task is done; it does not say what was built, where it lives, or what you decided along the way. Tick the box, then add a row to `## Implementation`'s **Built** table naming the task, the files, and anything a reader could not infer from the diff — a decision the design did not settle, a deviation and its reason, something deferred.

   ```markdown
   ## Implementation

   ### Built

   | Task | Files | Decisions the diff can't show |
   | ---- | ----- | ----------------------------- |
   | 2 — profile section | `src/features/settings/ProfileCard.tsx`, `src/app/api/settings/route.ts` | Cancel restores the saved name — the design did not say, and platform convention is the smaller state model. Reverse in one line if wrong. |
   | 3 — digest toggle | `src/features/settings/DigestToggle.tsx` | — |
   ```

   This is the record `/review` measures against, the context the cold review in `/ship` cannot get any other way, and the answer to "why is this like that" six weeks out. Write it as each task closes, not in a sweep at the end — by then the reasons have evaporated and you will write what the code does, which the code already said.

   Keep the last column to what the diff cannot say — a real decision in a sentence or two, or `—` when there is none. Not a summary of the code, and never a history of how it changed — rule 10 applies here too.

   **The record is committed with the code it describes**, in the same commit as the task it belongs to — not left uncommitted for a later sweep. The design file is tracked like any other, and a log that lands a commit away from its diff is a log a reviewer reads out of order.

   **A fix pass is a build pass.** When you are fixing review findings rather than working a fresh task — `/review` handed you must-fix items, or `/ship` is at stage 4, 6 or 8 — the same rule applies, one row per finding in the **Findings** table: **its id, what was wrong, and what was done** — fixed and where, or not fixed and why.

   ```markdown
   ### Findings

   | ID | What was wrong | Outcome |
   | -- | -------------- | ------- |
   | CR-4 | Digest toggle persisted immediately, raced the profile save | Fixed — moved behind an explicit save button, `src/features/settings/DigestToggle.tsx`; PR #42 description updated |
   | CR-7 | Theme toggle is plan drift | Not fixed — user asked for it mid-build; `## Scope` amended instead |
   | FT-2 | Empty display name submitted without validation | Fixed — `src/features/settings/ProfileCard.tsx` |
   ```

   Add the `### Findings` table the first time a fix pass runs; a build with no review yet has only `### Built`.

   **This is the only record of the fix pass.** The reviews print their findings to the terminal and write no file, so a finding fixed and recorded here needs nothing else; one still open also goes in the PR body under Known findings. A fix that lands with no row here is the fastest way for the next review to re-find the same thing, or for a reader to see code that no task explains.

10. **No historical comments.** Comments describe what the code does now, never how it got here. No `// changed from X`, no `// previously did Y`, no `// added per review feedback`, no commented-out old implementation left "just in case". Git already records history accurately and searchably; a comment claiming it is unverifiable, and it starts rotting the moment someone edits nearby. This matters most when `/ship` or a review-fix pass is driving the build, because that is exactly when the temptation to annotate the change is strongest.

11. **Close the loop.** After the last phase, one summary: what was built, tests status, anything deferred. Then: "Build done. Run `/review` to check the code against the design."

## Two ways in

**From `## Tasks`** — the normal path. Work the tasks in order, as the phases below describe.

**From a review report** — `/review` produced findings, or `/ship` is at one of its fix stages. Same skill, same conventions, different input:

1. Read the findings. **They arrive as text, not as a file** — reviews print to the terminal and write nothing to the repo. Whoever ran the review hands them over: `CR-n` / `SEC-n` / `DR-n` from a warm review, `CCR-n` / `CSEC-n` from a cold one, `FT-n` from a browser test.
2. Fix must-fix and should-fix findings. Consider-level ones are optional; take the cheap ones.
3. **Report against every finding by id.** Each one is fixed, or not fixed with a one-line reason. A finding you silently skip gets re-found by the next review, which is the most expensive way to learn you skipped it.
4. Record each one as a row in `## Implementation` → `### Findings`, per rule 9 — id, what was wrong, what was done. That section is the only durable record of the fix pass.
5. Commit as `fix:` per `keep-it-simple`, and re-run the tests.

A finding you disagree with is not a finding you ignore. Say why you think it is wrong, in one line, and leave it unfixed — that is a position the user can overrule. Silence is not.

## Reading the test plan

If the design file's `## Tests` section is filled, read it before writing any tests. It already names the cases, the level each belongs at, what to break to prove them, and — as usefully — what not to test. Writing tests without it means re-deriving all of that from the design, badly, and usually over-covering the easy paths while missing the failure modes somebody already thought through.

Where `## Tasks` attaches cases to tasks, those are the same cases: `brief-to-tasks` carried them over. Read `## Tests` anyway for the "Not testing" list, which does not survive that trip.

## Reading preflight's marks

`/preflight` edits the plan in place rather than leaving a report beside it, so its findings are already in `## Tasks` — corrected steps, and markers on the ones it could not resolve.

**A step marked `preflight: BLOCKED — <PF-n>` is not buildable.** Preflight leaves that marker on a step where the answer was the user's to give. Stop before that task, quote the marker, and ask — building it means guessing the answer preflight deliberately refused to guess.

Tasks that do not depend on the blocked one can still be built. Say which you are skipping and why.

## House Conventions

Load these before writing code. Each is a real skill — read its `SKILL.md` and follow it, do not work from the summary here.

**Always, in every repo:**

| Skill | Applies to |
| ----- | ---------- |
| `errors` | Every error you throw, wrap, or handle. Typed errors with stable codes and cause chains, thrown not returned — and the message a user reads kept separate from the one you debug from. |
| `logging` | Every log line. Structured, carrying trace-id, an identity anchor, and an operation name, with a specific message, correct level, no secrets or PII. |
| `keep-it-simple` | Commit messages, branch names, code comments, and any docs written along the way. |

**This project's own rules come first.** If `.claude/rules/` exists, read every file in it before anything below. `/bootstrap` writes the project's chosen folder structure there as `0001-structure.md`, and a structure decision made when the repo was created outranks any default — putting a file in the wrong folder is cheap to fix now and expensive once fifty imports point at it.

**Then detect the stack** and load its conventions:

| Detect | Load |
| ------ | ---- |
| `tsconfig.json`, or `.ts`/`.tsx` files — **and** `atelier-typescript` installed | `typescript-conventions`. Then `references/react.md` for frontend work, `references/fastify.md` for backend work — read the half you need, not both. |
| `pubspec.yaml`, or `.dart` files — **and** `atelier-flutter` installed | `flutter-conventions` — feature-first structure, layering, widget and state rules. It also points at the Flutter team's official skills and recommends installing them when missing. |
| Fastify in `package.json`, and you are adding an endpoint | `fastify-route` for the route's shape |

A repo can match more than one row — a Flutter app with a Node backend loads both, each for its own half of the tree.

**A note on the `security-guidance` plugin.** If it is installed, it runs a `PreToolUse` hook on every `Edit`/`Write` and warns about injection, XSS, and unsafe patterns as you write them. There is nothing to invoke — but the warnings are real findings arriving at the cheapest possible moment, and working past one silently means the same issue comes back as a review finding later. Address it or say why it does not apply.

If the repo matches a stack but its plugin is not installed, say so once in the opening scan — "TypeScript repo, but `atelier-typescript` isn't installed, so I'm building without the house TS conventions" — and continue. Do not stall on it, and do not invent conventions from memory.

Where a skill's convention and the existing codebase disagree, **the codebase wins** and you say so in one line. One consistent idiom beats one correct idiom plus one legacy idiom, because every future reader then has to know which files follow which.

## Phase Details

### Phase 1: Frontend Build

**Before running `ui-build`, materialize the token spec if needed.**

If the design file's `### Tokens` block (under `## Experience`; a top-level `## Tokens` in older files) names new tokens AND the project has no existing token file (no `tokens.css`, no populated `theme.extend`, no `theme.ts` from a prior pass), translate the spec into the project's stack-appropriate format:

- Tailwind project → extend `tailwind.config.js` (colors, spacing, fontFamily, etc.) AND write CSS variables to `globals.css` for anything that needs runtime theming.
- Plain CSS/HTML → write to `tokens.css`, imported by the root stylesheet.
- CSS-in-JS (Material UI / Chakra / Emotion) → write to `theme.ts` or `theme.js` in the expected shape for the library.
- Default when unclear → CSS custom properties in `tokens.css`.

Read the token names, values, and semantic roles directly from that block. Do not re-derive from the philosophy — the spec already made those decisions. Announce the file created in one line, then proceed. When the block says "no new tokens", there is nothing to materialize.

Then read `${CLAUDE_SKILL_DIR}/../ui-build/SKILL.md` and follow it. Work through the frontend tasks in `## Tasks` in order. After each task, tick its box, add its row to `## Implementation` → `### Built` per rule 9, and continue to the next.

- **Input**: `## Tasks`, `## Problem`, `## Solution`, `## Scope` (or the PRD), `## Experience`, `## Structure`, materialized token file.
- **Produces**: frontend components + pages + (if materialized this pass) the token file.
- **Transition**: "Phase 1 done: N files, tests green. Next phase: backend build. Go?" — skipped when gates are off, and skipped entirely when `## Architecture` says there is no server work.

### Phase 2: Backend Build

Read `${CLAUDE_SKILL_DIR}/../backend-build/SKILL.md` and follow it. Hand it the `## Architecture` section of `.design/YYYY-MM-DD-<slug>.md` as the source of truth.

- **Input**: `## Architecture` + existing codebase.
- **Produces**: server code (routes, plugins, migrations, tests) — build + tests passing.
- **Transition**: "Backend built and tests green. Run `/review` next to check the code."

## What This Skill Is Not

- Not a designer — this skill writes code. `/design` produces the docs it consumes.
- Not a reviewer — `/review` does the technical + visual review after the build.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.
- Not a chatty pipeline — decisions were made in `/design`. The gate between phases is go/no-go, not a design conversation; everything else only stops on real blockers (see rule 6).

## Done when

- Every task in `## Tasks` is implemented and ticked, and `## Implementation` → `### Built` carries a row for each one
- Every gate was asked, or gates were turned off once and out loud
- Build passes and tests are green, or you named exactly which are not and why
- The house conventions were loaded and followed
- Nothing was left half-done without saying so

**Then hand off.** Say: "Build done: N files, tests green." Name anything deferred, then: "Next: **`/atelier:review`** to check the code against the design." 
