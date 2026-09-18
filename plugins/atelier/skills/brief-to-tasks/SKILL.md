---
name: brief-to-tasks
description: Break a design into an ordered checklist of independently buildable tasks using vertical slices. Fills the `## Tasks` section of the feature's `.design/YYYY-MM-DD-<slug>.md`. Use when user wants to break down work, create tasks from a brief, plan implementation order, or mentions "tasks" or "breakdown".
---

This skill turns a design into an ordered, buildable task list, written into the `## Tasks` section of the feature's `.design/YYYY-MM-DD-<slug>.md`. Each task is a vertical slice: a piece of UI that can be built, reviewed, and verified on its own.

## Example prompts

- "Break the brief into tasks"
- "What should I build first?"
- "Create a task list from the design brief"
- "Plan the build order for this feature"

## Process

1. Read the design. Find the feature's design file by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file**. Read every section already filled — `## Problem`, `## Solution`, `## Scope` (or the PRD it points at), `## Experience` and its `### Tokens`, `## Architecture`, `## Structure`, `## Tests`. The cases in `## Tests` become test tasks alongside the implementation work: one task per meaningful assertion, grouped in the "Tests" group below. In a legacy six-file folder, read `DESIGN_BRIEF.md` / `INFORMATION_ARCHITECTURE.md` / `DESIGN_TOKENS.md` / `TEST_PLAN.md` and write `TASKS.md` beside them as before. If nothing exists, ask the user to describe what they are building.

2. Explore the existing codebase to understand what is already built. Scan specifically for:
   - **Component directories**: `components/`, `ui/`, `shared/` and list every component by name
   - **Existing pages/views**: what is already built that this feature must coexist with
   - **Token/theme files**: `tokens.css`, `globals.css`, Tailwind config, theme providers
   - **File naming conventions**: kebab-case, PascalCase, how files are organized (by feature, by type)
   - **Test files**: if tests exist alongside components, new tasks should include test expectations
   - **Package.json dependencies**: what UI libraries, animation libraries, and icon sets are already installed
   - Classify each relevant component as: will be reused as-is, needs modification, or does not exist yet. Only components that need modification or creation get their own tasks.

3. Break the work into vertical slices. Each task should:
   - Be independently buildable (no task should block another unless noted).
   - Include structure, styling, and interaction in a single task (not "build HTML" then "add CSS" then "add JS" as separate tasks).
   - Be verifiable: you can look at the result and confirm it matches the brief.
   - Be small enough to complete in a single session — roughly 30 min to 2 hours of focused work. If a task feels bigger, split it (e.g., "Header with nav + user menu" → "Header shell + nav links" and "User menu dropdown"). If it feels smaller than 30 min, merge it with an adjacent task.

4. Order tasks by:
   - **Dependencies first**: foundational elements (tokens, layout shells, shared components) before page-specific work.
   - **Visual priority**: the most prominent UI element early, so the user can validate the aesthetic direction before investing in details.
   - **Risk first**: the hardest or most uncertain piece early, so problems surface before everything else is built around them.

5. Write the checklist into the `## Tasks` section of the file you discovered in step 1, under the name it already has.

## What to write in `## Tasks`

Groups, not sub-documents. **A checklist, not a table** — `/build` ticks these boxes as it goes, and a table cell has no checkbox. Use only the groups this feature needs — a four-task change does not need five headings. **Reference the sections above rather than repeating them**: a task names the interaction from `## Experience` or the endpoint from `## Architecture`, it does not re-describe it.

```markdown
## Tasks

### Foundation
- [ ] **[Task name]**: [One sentence describing what to build and what "done" looks like]. _Reuses: [existing components/tokens if any]._
- [ ] **[Task name]**: [Description]. _New component._

### Core UI
- [ ] **[Task name]**: [Description]. _Depends on: [task name if any]._

### Interactions & States
- [ ] **[Task name]**: [Description]. Covers: [list of states, e.g., hover, loading, error, empty].

### Responsive & Polish
- [ ] **[Task name]**: [Description]. Breakpoints: [which ones].
- [ ] **[Task name]**: Accessibility pass. [specific checks from `## Experience`].

### Tests
_One task per case in `## Tests`, at the level named there. Omit this group when `## Tests` is empty._
- [ ] **[unit] [case name]**: [assertion in one line].
- [ ] **[integration] [case name]**: [assertion in one line]. _Real dep: [Postgres / Redis / etc]._
- [ ] **[e2e] [case name]**: [assertion in one line]. _Tooling: Playwright (or Claude Chrome extension for exploratory walk-through)._
```

No `### Review` group. `/review` and `/ship` own the design review; a checkbox for it here sits unticked after either one runs, and reads as unfinished work.

## Rules

- Every task must reference whether it reuses, modifies, or creates components.
- Never create a task that is only "set up the project" or "create the file structure." Those are not vertical slices.
- If the brief specifies an aesthetic philosophy, note it in the first build task so the visual direction is established immediately.
- Group related tasks but do not nest them more than one level deep. Flat lists are easier to work through.

## Done when

- `## Tasks` in `.design/YYYY-MM-DD-<slug>.md` is filled, ordered so each task is independently buildable
- Every task is a vertical slice that leaves the app working, not a layer
- The cases in `## Tests` are attached to the tasks they cover
- No task repeats a decision `## Experience` or `## Architecture` already made — it references it

**Then hand off.** Say: "Tasks written to `.design/YYYY-MM-DD-<slug>.md` — N tasks." Then: "Design is done. Next: **`/atelier:preflight`** to check the plan against the repo, then **`/atelier:build`** — or **`/atelier:ship`** to run build, test, review and open a PR unattended." 
