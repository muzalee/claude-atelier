# Atelier — Operating Rules

Runtime rules for Claude when the `atelier` plugin is active. Governs how Claude reaches for these skills vs. defaulting to its own workflow.

## 1. Prefer skills over improvisation

If a task maps to an atelier skill, use it — don't reinvent it in freeform:

- Planning a new feature end-to-end → `/atelier:design`
- Implementing from a completed `.design/<slug>/` → `/atelier:build`
- Reviewing built code against the design → `/atelier:review`
- Scaffolding a fresh repo → `/atelier:project-bootstrap`
- Writing just a brief / tokens spec / IA / tasks → the matching phase skill (`design-brief`, `design-tokens`, `information-architecture`, `brief-to-tasks`)
- Terse commits, PRs, docs, comments → `keep-it-simple`

State which skill you're about to run before running it, so the user can redirect. If the ask is adjacent but not exact ("just sketch a plan real quick"), do the adjacent thing — don't force a full orchestrator.

## 2. Never paraphrase a skill

When executing an atelier skill, read its `SKILL.md` and follow it end to end. Do not summarize away confirmation gates, phase transitions, or output paths. The skills exist to be executed, not narrated.

## 3. Boundaries are hard

- `/atelier:design` and its phases produce **markdown only** in `.design/<slug>/`. No code.
- `/atelier:build` produces **code**, reading `.design/<slug>/` for intent.
- `/atelier:review` produces a **report**, editing nothing.

If a user request would cross a boundary mid-skill (e.g. asks you to code during `/design`), pause, name the boundary, and offer to close the current phase before switching modes.

## 4. Design asks. Build executes. Review reports.

- **`/design`** is the interactive phase. Confirmation gates between every phase are non-negotiable — decisions live here.
- **`/build`** runs autonomously. No per-phase confirmation. State the plan, execute end to end, only pause on real blockers (docs contradict code, missing service with no obvious fallback, destructive migration).
- **`/review`** runs autonomously. Produces a report, edits nothing.

The user chose `/design` when they wanted to think, and `/build` when they wanted to ship. Do not turn `/build` back into `/design`.

## 5. Resume, don't restart

On re-invocation of an orchestrator, if `.design/<slug>/` already contains artifacts, list what exists and offer to resume from the next incomplete phase. Never restart from phase 1 without asking.

## 6. Baseline knowledge fills the gaps

Atelier does not replace everything. For anything a skill does not cover — a language-specific bug, a stdlib question, a git command, a one-off script, a config tweak — use your own knowledge. Do not invent a skill or force an ill-fitting one.

Rule of thumb: **skill for the named workflows above, baseline knowledge for everything else.**

## 7. Ambient talk ≠ invocation

The user can discuss design, briefs, tokens, IA, tasks without triggering `/design`. Only fire an orchestrator on explicit invocation (`/design`, "run the design pipeline", etc.). This mirrors each orchestrator's own `description` gating.
