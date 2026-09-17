---
name: design-brief
description: Create a design brief through an interactive interview, codebase exploration, and experience design decisions. Fills the `## Problem`, `## Solution`, `## Scope` and `## Experience` sections of the feature's `.design/YYYY-MM-DD-<slug>.md`. Use when user wants to write a design brief, plan a new feature or page, define a UI direction, or mentions "brief".
---

This skill creates a design brief through structured conversation. You may skip steps if they are not necessary.

The brief is not a document of its own — it is the first four sections of the feature's one design file, `.design/YYYY-MM-DD-<slug>.md`. This skill creates that file.

## Example prompts

- "Write a brief for the onboarding flow"
- "I need to plan a settings page before I start building"
- "Help me define the direction for a marketing landing page"
- "Brief this: a dashboard that shows project health metrics"

## Process

1. Ask the user for a detailed description of what they want to build, who it is for, and any constraints or ideas they already have.

2. Explore the existing codebase to understand the current state. Scan for each of the following specifically:
   - **CSS variables / tokens**: files named `tokens.css`, `variables.css`, `theme.css`, or `:root` declarations with custom properties
   - **Tailwind config**: `tailwind.config.js` or `tailwind.config.ts`, check `theme.extend` for custom values
   - **UI framework themes**: Material UI `createTheme`, Chakra `extendTheme`, shadcn `globals.css` and `components.json`
   - **Component directories**: `components/`, `ui/`, `shared/`, or any folder containing reusable UI pieces
   - **Storybook**: `.storybook/` directory or `*.stories.*` files indicating a documented component library
   - **Design token files**: JSON token files (Style Dictionary format, Figma token exports)
   - **Package.json UI dependencies**: tailwindcss, @mui/material, @chakra-ui/react, @radix-ui, lucide-react, framer-motion, etc.
   - **Font loading**: Google Fonts links in HTML, `@font-face` declarations, font imports in CSS/config
   - **Existing pages/layouts**: route files, layout components, page templates that show established patterns
   - If components exist, treat them as the starting vocabulary. The brief should extend, not replace.

3. Interview the user relentlessly about every aspect of the design until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

   Cover at minimum:
   - Who is the primary user their JTBD and what are they trying to accomplish?
   - What does success look like for this interface?
   - What is the emotional tone? (calm, urgent, playful, authoritative, warm, clinical)
   - What existing products, sites, or styles should this feel like? What should it NOT feel like?
   - What are the hard constraints? (devices, accessibility requirements, performance budgets, brand guidelines)
   - What content will this interface contain? What is placeholder vs. real?

4. Once you have a complete understanding, fill the sections using the guidance below.

## File Output

Write into the `## Problem`, `## Solution`, `## Scope` and `## Experience` sections of `.design/YYYY-MM-DD-<feature-slug>.md`, where `<feature-slug>` is a short, lowercase, hyphenated name derived from the feature or page being designed (e.g., `onboarding-flow`, `settings-page`, `project-dashboard`).

**This skill creates the file, and it is the only one that does.** It also writes the `# Design: <feature>` title, the `> PRD: docs/prd/NNNN-<slug>.md` line when a PRD covers this work (omit the line entirely when none does), and the remaining empty headings in their fixed order so later phases have somewhere to write:

```markdown
# Design: <feature>

## Problem
## Solution
## Scope
## Experience
## Architecture
## Structure
## Tokens
## Tests
## Tasks
## Implementation
```

On the **short form** (`/design` decides which — one screen, no new data, no new route, no new dependency, no auth or money path), write only `## Problem`, `## Solution`, `## Tasks` and `## Implementation`, and omit the other six headings entirely rather than stubbing them.

**This skill picks the date, and it is the only one that does.** Read today's date from the environment — run `date +%F` — and use it verbatim. Never guess it, never reuse a date from an example. Once the folder exists the date is frozen: it records when the design started, not when it was last touched.

Before creating anything, glob `.design/*<feature-slug>*/`. If a folder for this feature already exists — dated or a legacy bare `.design/<feature-slug>/` from before this convention — write into it as it is named. Do not mint a second folder and do not rename the existing one.

**A legacy folder keeps its old shape.** If the folder you found has no `DESIGN.md` but does have `DESIGN_BRIEF.md`, keep writing to `DESIGN_BRIEF.md`. Do not convert the folder and do not start a `DESIGN.md` beside the old files.

This folder structure ensures that running the design flow multiple times for different features does not overwrite previous work. All subsequent skills (backend-design, information-architecture, design-tokens, test-plan, brief-to-tasks, build, review) discover this folder by globbing and write into the same file — they never create their own.

Example:

```
.design/
├── 2026-09-20-onboarding-flow/
│   └── DESIGN.md
└── 2026-09-21-settings-page/
    └── DESIGN.md
```

## What to write in each section

The headings below are the four this skill owns. Everything the old standalone brief covered still gets decided — it just lands in one of these four rather than in a document of its own. **Write only what this feature actually touches**: a sub-heading with nothing real under it is worse than an absent one, and a table of `[name] | Exists / Modify / New | [detail]` placeholders is not a component inventory.

```markdown
## Problem

What problem is the user facing, from their perspective. Not technical. Not business metrics. The human friction.

## Solution

What this interface does about it, described as an experience, not a feature list.

## Scope

**In scope**: what this design covers.
**Out of scope**: what it explicitly does not. Be specific — "polish and extras" prevents nothing. This is what stops scope creep during the build.

## Experience

**Philosophy**: named philosophy or described vibe (see `ui-build` for reference), plus the emotional tone, what it should feel like, and what it should NOT.

**Principles** (at most three, only if they earn their place): each one resolves a tension — "progressive disclosure over upfront complexity", "confidence over speed" — and says what it means in practice.

**Existing patterns**: the typography, colors, spacing and components already in the codebase that this design extends rather than replaces.

**Components**: which the feature needs, and for each whether it exists, needs modifying, or is new. A list is fine; a table is fine; a table of placeholders is not.

**Key interactions**: what the user does and what the interface does back — state changes, transitions, feedback. **Name each one**, because `## Tests` and `## Tasks` refer to them by name instead of describing them again.

**Responsive**: how the layout adapts, and which components change *behavior* rather than just size on mobile.

**Accessibility**: contrast ratios, keyboard navigation, screen reader needs, focus management — the minimum this interface must meet.
```

On the short form there is no `## Scope` or `## Experience`. Fold anything genuinely decided into `## Solution` in a line or two and move on.

## Done when

- `.design/YYYY-MM-DD-<slug>.md` exists, with the title, the PRD line when there is a PRD, and the headings for the chosen form in order
- `## Problem`, `## Solution`, `## Scope` and `## Experience` are filled (short form: `## Problem` and `## Solution`)
- The `<slug>` is locked — every later phase writes into this same file
- Out of Scope is specific, not "polish and extras"
- The aesthetic direction names something concrete enough to build from
- Nothing is a placeholder — every line says something about this feature

**Then hand off.** Say: "Brief sections written to `.design/YYYY-MM-DD-<slug>.md`." Then: "Next: **`/atelier:backend-design`** if this needs server work, otherwise **`/atelier:information-architecture`**."
