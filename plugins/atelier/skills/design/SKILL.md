---
name: design
description: Explicit-invocation-only orchestrator for the pure-design pipeline — grill → brief → backend-design → IA → tokens → test-plan → tasks, gated between phases — filling one file, `.design/YYYY-MM-DD-<slug>.md`, in short or full form. Writes no code. Invoke as `/atelier:design`; a bare `/design` can hit the built-in design canvas or `ui-ux-pro-max:design`. Use ONLY on /atelier:design, /design, or "run the design pipeline". DO NOT auto-trigger from talk about briefs, IA, tokens, tests or tasks — those have their own skills.
---

This skill is the **pure-design** orchestrator. It runs seven phases in strict order and produces one markdown document — no code. Everything lands in `.design/YYYY-MM-DD-<slug>.md` and becomes the input to `/build`.

The three-part pipeline:
- `/design` — this skill. Produces the design doc.
- `/build`  — reads it and writes the code.
- `/review` — reviews the code against it.

## The one file

Every phase fills a section of the same file. Nothing gets its own document, and there is no per-feature folder.

```
.design/YYYY-MM-DD-<feature-slug>.md
```

## Finding the design file

**This is the discovery procedure for every atelier skill.** Other skills reference this section rather than restating it; when they disagree with it, this wins.

Glob `.design/*.md` for the current shape, and `.design/*/` as well when you find nothing — two legacy shapes live in folders and are still readable:

| Shape | Looks like | Written by |
| ----- | ---------- | ---------- |
| **Current** | `.design/YYYY-MM-DD-<slug>.md` | every skill, from now on |
| **Legacy, one file** | `.design/<slug>/DESIGN.md`, dated or undated | never — read only |
| **Legacy, six files** | `.design/<slug>/DESIGN_BRIEF.md` + `BACKEND_DESIGN.md`, `INFORMATION_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `TEST_PLAN.md`, `TASKS.md`, dated or undated | never — read only |

Rules, the same in every skill:

- **Several matches** → take the most recent date, and say out loud which one you picked. Undated sorts oldest.
- **Reuse the name verbatim.** Never rename a file or folder, never re-date one, never create a second file for a feature that already has one.
- **A legacy shape is read where it lies and written where it lies.** A folder holding `DESIGN_BRIEF.md` keeps taking `DESIGN_BRIEF.md` edits; a folder holding `DESIGN.md` keeps taking `DESIGN.md` edits. Do not convert, do not migrate, do not start a flat file beside one.
- **An older current-shape file may carry a top-level `## Tokens`, a `## Scope` beside a PRD line, or bullet lists where the templates now show tables.** All three were standard before tokens moved under `## Experience`, scope moved to the PRD, and enumerable content moved to tables. Read them where they are and keep writing there in the shape they already have — do not move or convert them.
- **Only `design-brief` creates a design file**, and only when nothing matches. It takes the date from the environment (`date +%F`), never from memory, and that date is frozen for the life of the file. **No other skill creates one** — a phase skill that finds nothing to write into says so and offers `/atelier:design`, and none of them creates `.design/` just to have somewhere to write.

## Pick the shape first — before phase 1

The full document is right for a feature and absurd for a copy tweak. A small change should not produce a file that is 70% "N/A" — that reads as a design nobody did, not a design that was not needed.

So before phase 1, judge the size of the change **with the user** and pick one of two shapes. **Say which form you picked and why, in one line, before writing anything.**

**Short form** — one screen, no new data, no new route, no new dependency, no auth or money path touched. Write only:

```markdown
# Design: <feature>

## Problem
## Solution
## Tasks
## Implementation
```

Omit the other headings **entirely**. Do not write them with "N/A" underneath — an absent heading says "not relevant", a stubbed one says "skipped".

**Full form** — everything else. The sections below.

- **Growing from short to full mid-build is normal and cheap.** Add the headings when the work turns out to need them, and say so. Starting full "just in case" is the thing to avoid.
- **The short form still goes through the same gates and the same `/build`, `/review` and `/ship` pipeline.** It is a shorter document, not a lighter process.
- **If even the short form feels like ceremony, say so** and recommend `/atelier:build` plus `/atelier:code-review` directly — `${CLAUDE_SKILL_DIR}/../ship/SKILL.md` offers that same fork in its prerequisites. A one-line change does not need a document.

## Full form

```markdown
# Design: <feature>
> PRD: docs/prd/NNNN-<slug>.md      ← omit the line entirely when there is no PRD

## Problem
## Solution           — ends with "Considered and rejected": what lost, and why
## Scope              — in scope / out of scope; ONLY when there is no PRD
## Experience         — philosophy, key interactions, responsive, accessibility,
                        and a ### Tokens block: only new or changed tokens, or the
                        project's existing token file and "no new tokens"
## Architecture       — data model, API surface, auth, invariants, failure modes
## Structure          — routes, user flows, component reuse
## Tests              — a table, one case per row, plus a "Not testing" table
## Tasks              — the build checklist
## Implementation     — filled in during /build and /review, empty until then
```

The section order above is fixed. Write the headings in that order and leave the ones a later phase fills.

## The Sequence

```
0. Pick the shape           → short form or full form, said out loud
1. Grill Me                 → decisions, and the alternatives they beat (no file yet)
2. Design Brief             → creates the file; fills ## Problem, ## Solution, ## Scope (no PRD only), ## Experience
3. Backend Design           → fills ## Architecture
4. Information Architecture → fills ## Structure
5. Design Tokens            → fills ### Tokens under ## Experience   (spec, not code)
6. Test Plan                → fills ## Tests
7. Brief to Tasks           → fills ## Tasks
```

**On the short form, phases 3-6 do not run at all** — their sections do not exist, so there is nothing to skip and nothing to explain. Phases 1, 2 and 7 run as written, filling only `## Problem`, `## Solution` and `## Tasks`.

At the end there is one markdown file in `.design/`. Nothing has been implemented. The user then runs `/build`.

**The full form leans frontend.** `## Experience` and `## Structure` are UI sections. A backend-only feature still writes both headings, each with one line — "No UI; callers are the services named in `## Architecture`." — and puts its weight in `## Architecture` and `## Tests`. That is the form working as intended, not a design with holes in it.

## Writing rules — these are the point

1. **In the full form, a phase that does not apply gets its heading and one line saying why.** "No server work." "No new tokens — the project's scale lives in `tailwind.config.ts`." Never a heading full of TODOs, never a placeholder table with `[type]` in the cells. An empty section with a reason is information; a template nobody filled is noise a later reader has to re-check.

   **In the short form the extra headings are absent, not empty.** That is the difference between the two shapes: full form says "we considered the backend and there isn't one", short form says "this was never a question".

2. **Only write what this feature actually touches.** The sub-skills' templates are menus, not forms. `backend-design`'s Deployment / Observability / Scale / Consistency headings exist for a **new service**; a feature on an existing backend collapses them to one line each or drops them. Same for the rest — a component inventory table with two rows is better than one with two rows and eight placeholders.

3. **Do not restate a decision in two sections.** Key interactions belong in `## Experience`. `## Tests` names them and asserts on them rather than re-describing them. `## Tasks` references both rather than repeating either. A decision written twice becomes two decisions the moment one copy is edited.

4. **`## Implementation` stays empty during design.** `/build` and the fix passes fill it. Write the heading and nothing under it.

5. **Tables for anything enumerable.** Components, interactions, entities, endpoints, failure modes, routes, test cases, rejected alternatives, findings — anything with a fixed set of fields goes in a table, because a table is what a human scans first. Prose only where the content is reasoning rather than a list: the problem, the philosophy, a decision's why. Each sub-skill's template shows its tables.

   **`## Tasks` is the one exception: it stays a checklist.** `/build` ticks the boxes as it goes, and a markdown table has no checkbox — GitHub stops counting progress, and a one-character tick becomes a whole-row edit.

## Operating Rules

1. **Open with the shape, then the map.** Say which form this change gets and why, in one line. Then tell the user the phase sequence for that form, name the section each phase fills, and ask if any phase should be skipped. Common skips (full form):
   - Already have a clear idea → skip grill-me
   - Pure-frontend feature with no server work → skip backend-design (`## Architecture` gets "No server work.")
   - Backend-only service → skip IA + tokens (see **The full form leans frontend** above)
   - Single component, not a full page → skip information-architecture
   - Existing project with an established token system → skip design-tokens
   - Trivial change (typo fix, one-line copy tweak, no logic) → skip test-plan

   In the full form a skipped phase still gets its heading with the one-line reason: a missing heading reads like an oversight, a heading saying "No server work." reads like a decision. In the short form those headings were never in the document to begin with.

2. **Announce each phase before entering it.** Format: "Phase N: [name]. This will [what it does] and fill [section]. Ready?" Wait for confirmation.

3. **Run each phase by reading its SKILL.md and following it in full.** Do not summarize, paraphrase, or skip steps — the sub-skills exist to be executed, not narrated. Their interview process and content guidance are unchanged; only where the output lands has changed.

4. **This skill writes no code.** Even the tokens phase fills a `### Tokens` spec block, not a `.css` or `tailwind.config`. Materialization happens in `/build`. If the user starts asking you to code mid-`/design`, remind them that `/build` is the next step and offer to close out design first.

5. **Thread the file forward.** Each phase reads the sections already written before filling its own — that is how `## Tests` can reference interactions by name instead of re-deriving them, and how `## Tasks` covers every decision. Hand the file path and the section name to each sub-skill.

6. **End each phase with a checkpoint.** Summarize the section just filled, 2-3 key decisions, any open questions. Then ask: "Ready for the next phase?" Do not proceed until the user says yes.

7. **The user can stop or pause at any point.** If they say "that's enough for now," list which sections are filled and tell them which phase they'd resume from.

8. **Resume on later invocations.** Discover by [Finding the design file](#finding-the-design-file). If one already exists, list which sections are filled, ask which to continue (newest date first, named in full), and offer to resume from the next empty section rather than restart from grill-me. Resuming reuses that name exactly — a resumed design does not get today's date, and a legacy folder stays a legacy folder.

9. **Respect the PRD if one exists.** Check `docs/prd/` at the start. If a PRD covers this initiative, read it before phase 1 and treat its requirements and non-goals as the scope contract — the design decides *how*, not *whether*. Name the PRD file in the opening map, and put `> PRD: docs/prd/NNNN-<slug>.md` directly under the `# Design:` title. With no PRD, omit the line — do not write "none".

   **With a PRD, there is no `## Scope`.** The PRD's requirements and non-goals are the scope, and the `> PRD:` line points at them. A second scope section in the design is a second surface to drift — the exact failure rule 10 exists to stop. Without a PRD, `## Scope` is where in/out of scope lives.

10. **Design can change requirements — but say so out loud.** Design routinely reveals that a requirement was wrong, impossible, or more expensive than it looked. When that happens, stop, tell the user which PRD requirement is affected, and offer to amend the PRD (read `${CLAUDE_SKILL_DIR}/../prd/SKILL.md`, Amend mode) before continuing. A design that silently contradicts its PRD leaves two documents claiming to be the scope, and the team then argues about which one counts.

11. **Commit the file.** `.design/YYYY-MM-DD-<slug>.md` is part of the repo, not scratch — it is what a PR reviewer reads to see what the code was meant to do. When the last phase closes, commit it per `keep-it-simple` (`docs(design): <slug> design`) and say you did. It also leaves the tree clean for `/ship`, which stops on a dirty one.

12. **Close the loop.** After phase 7, tell the user: "Design done. It is all in `.design/YYYY-MM-DD-<slug>.md`. Run `/build` when you're ready to implement, then `/review` when the code is ready to be checked."

## Phase Details

### Phase 1: Grill Me

Read `${CLAUDE_SKILL_DIR}/../grill-me/SKILL.md` and follow it. Surface and resolve open decisions before they bake into a design.
- **Input**: user's initial prompt + codebase.
- **Produces**: resolved decisions, plus the alternatives each one beat and why. No file yet — phase 2 writes the rejected alternatives under `## Solution` as "Considered and rejected", so "why didn't we do X?" still has an answer six weeks out.
- **Transition**: "Decisions resolved. Capture this as a design doc?"

### Phase 2: Design Brief

Read `${CLAUDE_SKILL_DIR}/../design-brief/SKILL.md` and follow it.
- **Input**: outcome of phase 1 — including the rejected alternatives — + any existing `.design/` content.
- **Fills**: `## Problem`, `## Solution`, `## Scope` (only when there is no PRD), `## Experience` — and writes the `# Design:` title and the PRD line. On the short form: `## Problem` and `## Solution` only. **This is the only phase that names the file and creates it.** `design-brief` takes the date from the environment (`date +%F`) — unless a file or legacy folder for this slug already exists, in which case it writes into that one. Lock the resulting name here, date and all, and hand it verbatim to every later phase; none of them mints a date of its own.
- **Transition**: "Brief sections written. Next is the architecture section — skip if this feature has no server work. Continue?"

### Phase 3: Backend Design

Read `${CLAUDE_SKILL_DIR}/../backend-design/SKILL.md` and follow it. Tell it to read the sections already in the design file first so the data model and endpoints serve the flows already named.
- **Input**: the design file + codebase.
- **Fills**: `## Architecture` — data model, API surface, auth, invariants, failure modes. On an existing backend, that is what the section is: the four or five things this feature adds. Deployment, observability, scale and consistency only appear when this feature actually changes them.
- **Transition**: "Architecture written. Next: structure. Continue?"

### Phase 4: Information Architecture

Read `${CLAUDE_SKILL_DIR}/../information-architecture/SKILL.md` and follow it. Tell it to read `## Experience` and `## Architecture` so routes and flows align with the API.
- **Input**: the design file.
- **Fills**: `## Structure` — routes, user flows, component reuse.
- **Transition**: "Structure defined. Next: tokens. Continue?"

### Phase 5: Design Tokens

Read `${CLAUDE_SKILL_DIR}/../design-tokens/SKILL.md` and follow it. Name the philosophy from `## Experience` up front so tokens derive from it. The output is a **spec** (token name, value, role) — **not** an actual CSS or Tailwind file. Materialization happens in `/build`.
- **Input**: the design file (philosophy) + codebase (for existing token conventions).
- **Fills**: `### Tokens` at the end of `## Experience` — **only tokens this feature adds or changes.** A project that already has a token file and needs nothing new gets one line naming that file and "no new tokens". Do not restate a palette the repo already defines.
- **Transition**: "Tokens written. Next: tests. Continue?"

### Phase 6: Test Plan

Read `${CLAUDE_SKILL_DIR}/../test-plan/SKILL.md` and follow it. Tell it to read `## Experience` and `## Architecture` so failure modes are named across the whole stack, not just the surface. This is where testing decisions get made — level (unit / integration / e2e), what to assert, and what NOT to test.
- **Input**: the design file.
- **Fills**: `## Tests` — a table, one case per row, plus a "Not testing" table. Reference the interactions in `## Experience` by name; do not re-describe them.
- **Transition**: "Tests written. Next: the task checklist. Continue?"

### Phase 7: Brief to Tasks

Read `${CLAUDE_SKILL_DIR}/../brief-to-tasks/SKILL.md` and follow it. Tell it to read every section above so tasks reflect every decision so far — including the test cases, which become task line items alongside the implementation work.
- **Input**: the design file.
- **Fills**: `## Tasks` — the build checklist, referencing the sections above rather than repeating them.
- **Transition**: "Tasks ready. Design phase complete. Run `/build` to implement, then `/review` to check the code."

## Project Files Structure

```
.design/
├── 2026-09-20-onboarding-flow.md
└── 2026-09-21-settings-page.md
```

One file per feature. Markdown. No folder, no code.

## What This Skill Is Not

- Not a builder — this skill writes no code. `/build` does that.
- Not a reviewer — `/review` handles code + visual review after the build.
- Not a wrapper — it runs the actual SKILL.md of each phase in full.
- Not a fire-and-forget — the confirmation gate between every phase is the point.

## Done when

- `.design/YYYY-MM-DD-<slug>.md` exists with the headings its form calls for, in order
- The form was named out loud before anything was written
- Every phase the user did not skip has filled its section; in the full form every skipped one has its heading and a one-line reason, and in the short form the extra headings are absent rather than stubbed
- `## Implementation` is present and empty
- No section restates a decision another section already made
- Nothing was implemented — this skill writes markdown only
- The file is committed and the working tree is clean

**Then hand off.** Say: "Design done. It is all in `.design/YYYY-MM-DD-<slug>.md`." Name the sections that were skipped and why, then: "Next: **`/atelier:preflight`** to check the plan still matches the repo, then **`/atelier:build`** to implement — or **`/atelier:ship`** to build, test, review and open a PR in one unattended run."
