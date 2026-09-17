# Atelier — Operating Rules

Runtime rules for Claude when the `atelier` plugin is active. Governs how Claude reaches for these skills vs. defaulting to its own workflow.

## 1. Prefer skills over improvisation

If a task maps to an atelier skill, use it — don't reinvent it in freeform:

- Defining what an initiative is and is not (scope, requirements, success metrics) → `/atelier:prd`
- Planning a new feature end-to-end → `/atelier:design`
- Checking whether an existing plan still matches the repo → `/atelier:preflight`
- Implementing from a completed `.design/YYYY-MM-DD-<slug>.md` → `/atelier:build`
- Reviewing built code against the design → `/atelier:review`
- Taking a design all the way to a review-ready PR, unattended → `/atelier:ship`
- Scaffolding a fresh repo → `/atelier:bootstrap`
- Writing just one section — brief / architecture / structure / tokens / tests / tasks → the matching phase skill (`design-brief`, `backend-design`, `information-architecture`, `design-tokens`, `test-plan`, `brief-to-tasks`)
- Terse commits, PRs, docs, comments → `keep-it-simple`
- Writing or reviewing TypeScript / React / Fastify → `typescript-conventions` (from `atelier-typescript`)
- Writing or reviewing Flutter / Dart → `flutter-conventions` (from `atelier-flutter`)

State which skill you're about to run before running it, so the user can redirect. If the ask is adjacent but not exact ("just sketch a plan real quick"), do the adjacent thing — don't force a full orchestrator.

## 2. Mind the name collisions

Two atelier skills share a name with something else that may be installed:

- **`design`** — collides with Claude Code's built-in design-canvas skill and with `ui-ux-pro-max:design`. Always invoke the orchestrator as `/atelier:design`. A bare `/design` is ambiguous and may open a canvas instead.
- **`ui-build`** — renamed from `frontend-design` for exactly this reason; Anthropic ships an official `frontend-design`. If a user says "frontend-design" they may mean either, so ask which when a `.design/YYYY-MM-DD-<slug>.md` is in play.

## 3. Never paraphrase a skill

When executing an atelier skill, read its `SKILL.md` and follow it end to end. Do not summarize away confirmation gates, phase transitions, or output paths. The skills exist to be executed, not narrated.

## 4. Boundaries are hard

- `/atelier:design` and its phases produce **one markdown file**, `.design/YYYY-MM-DD-<slug>.md`. No code.
- `/atelier:build` produces **code**, reading that file for intent and writing only its `## Implementation` section.
- `/atelier:review` **prints** its findings, writing and editing nothing.

If a user request would cross a boundary mid-skill (e.g. asks you to code during `/design`), pause, name the boundary, and offer to close the current phase before switching modes.

## 5. Design asks. Build executes. Review reports.

- **`/design`** is the interactive phase. Confirmation gates between every phase are non-negotiable — decisions live here.
- **`/build`** asks go/no-go between phases — "Next phase: X. Go?" — and skips every gate for the rest of the run when told **"go all"** (or `/build --all`, "run everything", "no gates", "unattended"). The gate is go/no-go, not a reopened design; a new decision at the gate is a blocker.
- **`/review`** runs autonomously, prints findings with stable ids, and edits nothing.

**An unattended caller says "go all" in its instruction text.** `/ship` stage 3 and any other skill spawning a build without a human watching puts the words in the literal instruction — a build that gates inside an unattended run stops at phase 1 and halts the pipeline.

The user chose `/design` when they wanted to think, and `/build` when they wanted to ship. Do not turn `/build` back into `/design`.

## 6. Resume, don't restart

On re-invocation of an orchestrator, if `.design/YYYY-MM-DD-<slug>.md` already has sections filled, list which ones and offer to resume from the next empty one. Never restart from phase 1 without asking.

## 7. The PRD outranks the design docs on scope

If `docs/prd/` holds a PRD for the initiative, it is the scope contract. `.design/YYYY-MM-DD-<slug>.md` decides *how*; the PRD decides *what* and *whether*. When design or build discovers that a requirement is wrong, infeasible, or newly out of scope, amend the PRD (`prd` skill, Amend mode) rather than letting the brief quietly disagree with it. Two documents claiming to define scope is worse than one imperfect one.

## 8. House conventions bind the code

`/build` and any fix pass load the conventions that apply before writing code: `errors` and `logging` always, `keep-it-simple` for commits and comments, and `typescript-conventions` when the repo is TypeScript and `atelier-typescript` is installed.

`/review` and `code-review` load the same two — `errors` and `logging` — before reviewing, and measure the diff against them. Both ends read the same file, so the convention holds whether or not the same session wrote the code. A convention only one side loads is a suggestion.

A project's own `.claude/rules/` outranks all of them — `/bootstrap` writes the chosen folder structure there when the repo is created. Where a convention and the existing codebase disagree, the codebase wins: say so in one line and match what is there.

## 9. Baseline knowledge fills the gaps

Atelier does not replace everything. For anything a skill does not cover — a language-specific bug, a stdlib question, a git command, a one-off script, a config tweak — use your own knowledge. Do not invent a skill or force an ill-fitting one.

Rule of thumb: **skill for the named workflows above, baseline knowledge for everything else.**

## 10. Always end by naming the next step

Every atelier skill has a `## Done when` section: the criteria that mean it is finished, and the handoff line to say afterwards. Follow both.

Stopping without naming what comes next leaves the user to remember a seven-phase pipeline on their own, and leaves you guessing whether you were finished or merely out of obvious moves. The exit criteria are what make that difference checkable rather than a feeling.

Two rules about the handoff:

- **Name the actual command**, namespaced — `/atelier:build`, not "you could build it now". A named command is one keystroke away; a hint is a lookup.
- **Suggest what fits the state you are in.** A preflight that came back Blocked should not suggest building. A review with three must-fix findings should suggest fixing them, not shipping.

## 11. Ambient talk ≠ invocation

The user can discuss design, briefs, tokens, IA, tasks without triggering `/design`. Only fire an orchestrator on explicit invocation (`/design`, "run the design pipeline", etc.). This mirrors each orchestrator's own `description` gating.

## 12. Date the design file once, then discover it

A design is one file, `.design/YYYY-MM-DD-<slug>.md`, where the date is the day it was created and never changes.

- **Only `design-brief` creates one**, as phase 2 of `/atelier:design`. It takes the date from the environment (`date +%F`), never from memory. No other skill creates a design file — the rest discover one or say there is none.
- **Every other skill discovers it** by the single procedure in `design/SKILL.md` → **Finding the design file**, and reuses the matched name verbatim. That section is the one description of discovery; skills reference it rather than restating it.
- **Two legacy shapes still read and are never written fresh**: `.design/<slug>/DESIGN.md`, and the original `.design/<slug>/DESIGN_BRIEF.md` plus siblings, dated or undated. Read and edit them where they lie. Do not convert them, do not migrate them, do not start a flat file beside one.
- **Never create `.design/` just to have somewhere to write.**

## 13. The design file is committed

`.design/YYYY-MM-DD-<slug>.md` is tracked in the repo and never added to a `.gitignore`. It is the intent record the PR reviewer and every later reader work from, and its `## Implementation` section is the build log. Skills commit it rather than re-arguing whether it belongs.

**Nothing else is.** Reviews print their findings and write no file; browser testing takes screenshots to look at and saves none. A finding is either fixed and recorded in `## Implementation`, or open and named in the PR body — those two places, and no third.
