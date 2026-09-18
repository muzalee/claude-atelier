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

**Find before you create.** Look for an existing design file by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file**, matching this feature's slug. If one exists — flat, or either legacy folder shape — write into it under the name it already has, in the shape it already has. Do not mint a second file, do not rename or re-date the one you found, and do not convert a legacy folder.

**Only when nothing matches, create the file — this skill is the only one that does.** Take the date from the environment — run `date +%F` — and use it verbatim. Never guess it, never reuse a date from an example. Once the file exists the date is frozen: it records when the design started, not when it was last touched.

A new file gets the `# Design: <feature>` title, the `> PRD: docs/prd/NNNN-<slug>.md` line when a PRD covers this work (omit the line entirely when none does), and the remaining empty headings in their fixed order so later phases have somewhere to write:

```markdown
# Design: <feature>

## Problem
## Solution
## Scope
## Experience
## Architecture
## Structure
## Tests
## Tasks
## Implementation
```

**With a PRD, leave `## Scope` out.** The PRD's requirements and non-goals are the scope, and the `> PRD:` line already points there. A second scope section is a second surface to drift.

On the **short form** (`/design` decides which — one screen, no new data, no new route, no new dependency, no auth or money path), write only `## Problem`, `## Solution`, `## Tasks` and `## Implementation`, and omit the other headings entirely rather than stubbing them.

Every later skill (backend-design, information-architecture, design-tokens, test-plan, brief-to-tasks, build, review) finds this file by the same procedure and writes into it — none of them creates its own.

```
.design/
├── 2026-09-20-onboarding-flow.md
└── 2026-09-21-settings-page.md
```

## What to write in each section

The headings below are the ones this skill owns — four without a PRD, three with one. Everything the old standalone brief covered still gets decided — it just lands in one of these four rather than in a document of its own. **Write only what this feature actually touches**: a sub-heading with nothing real under it is worse than an absent one, and a table of `[name] | Exists / Modify / New | [detail]` placeholders is not a component inventory.

**Tables for anything enumerable** — they are what a human scans first. The example rows below show the shape; replace them with this feature's, and drop a table that would have no real rows. Prose only where the content is reasoning, not a list.

```markdown
## Problem

What problem is the user facing, from their perspective. Not technical. Not business metrics. The human friction.

## Solution

What this interface does about it, described as an experience, not a feature list.

**Considered and rejected** — up to three rows. Grill-me's summary is where these come from. Without them, "why didn't we do X?" has no answer six weeks out.

| Alternative | Why it lost |
| ----------- | ----------- |
| Autosave every field | Races the profile save; an explicit save is the smaller state model |

## Scope

_Only when there is no PRD._

| In scope | Out of scope |
| -------- | ------------ |
| Display name and avatar edits | Email change — needs re-verification, separate design |

Be specific — "polish and extras" prevents nothing. This is what stops scope creep during the build.

## Experience

**Philosophy**: named philosophy or described vibe (the menu is `ui-build`'s `references/philosophies.md`), plus the emotional tone, what it should feel like, and what it should NOT. Prose — this is the one part that is not a list.

**Principles** — at most three, only if they earn their place. Each resolves a tension.

| Principle | In practice |
| --------- | ----------- |
| Confidence over speed | Every destructive action gets a confirm step |

**Existing patterns** — what this design extends rather than replaces.

| Pattern | Lives in |
| ------- | -------- |
| Card surface + 8px grid | `src/components/Card.tsx`, `tailwind.config.ts` |

**Components**

| Component | Status | Notes |
| --------- | ------ | ----- |
| `ProfileCard` | New | Wraps the existing `Card` |
| `AvatarMenu` | Modify | Adds a "Settings" item |

**Key interactions** — **name each one**, because `## Tests` and `## Tasks` refer to them by name instead of describing them again.

| Name | User does | Interface does |
| ---- | --------- | -------------- |
| Save name | Edits the field, clicks Save | Disables the button, saves, shows inline "Saved" |

**Responsive** — only components that change *behavior*, not just size.

| Component | Mobile | Desktop |
| --------- | ------ | ------- |
| Settings nav | Bottom sheet | Left rail |

**Accessibility** — the minimum this interface must meet.

| Requirement | Target |
| ----------- | ------ |
| Contrast | WCAG AA, 4.5:1 body text |
| Focus | Save returns focus to the edited field |

### Tokens

Left for `design-tokens` to fill. Write the sub-heading and nothing under it.
```

On the short form there is no `## Scope` or `## Experience`. Fold anything genuinely decided into `## Solution` in a line or two and move on.

A backend-only feature in the full form writes `## Experience` as one line naming the callers instead of a UI — see **The full form leans frontend** in `${CLAUDE_SKILL_DIR}/../design/SKILL.md`.

## Done when

- `.design/YYYY-MM-DD-<slug>.md` exists — found, or created only because nothing matched — with the title, the PRD line when there is a PRD, and the headings for the chosen form in order
- `## Problem`, `## Solution`, `## Scope` (no PRD only) and `## Experience` are filled (short form: `## Problem` and `## Solution`)
- `## Solution` names the alternatives that lost, when there were any
- The `<slug>` is locked — every later phase writes into this same file
- Out of scope is specific, not "polish and extras" — in `## Scope`, or in the PRD's non-goals
- The aesthetic direction names something concrete enough to build from
- Nothing is a placeholder — every line says something about this feature

**Then hand off.** Say: "Brief sections written to `.design/YYYY-MM-DD-<slug>.md`." Then: "Next: **`/atelier:backend-design`** if this needs server work, otherwise **`/atelier:information-architecture`**."
