---
name: information-architecture
description: Define the structural layer of a product or site before visual design begins. Covers navigation, content hierarchy, page structure, URL patterns, and user flows. Fills the `## Structure` section of the feature's `.design/YYYY-MM-DD-<slug>.md`. Use when user wants to plan site structure, define navigation, map user flows, organize content, or mentions "IA" or "information architecture".
---

This skill defines the structural skeleton of a product or site. It sits between the design brief and the build, and it fills one section — `## Structure` — of the feature's `.design/YYYY-MM-DD-<slug>.md`. Run it after the brief sections are written and before tasks are created.

## Example prompts

- "Plan the IA for this app before I start building"
- "Map out the navigation and page structure"
- "I need to organize the content for a documentation site"
- "Define user flows for the onboarding experience"

## Process

1. Find the feature's design file by the procedure in `design/SKILL.md` → **Finding the design file** (glob `.design/*.md`; two legacy folder shapes still read; several matches take the most recent date and say which; reuse the name verbatim; never create a second one). Or ask the user which feature they are working on; if nothing exists, ask what they are building and for whom.

   In a legacy six-file folder, read `DESIGN_BRIEF.md` and write `INFORMATION_ARCHITECTURE.md` beside it, as before.

   Read `## Problem`, `## Solution`, `## Scope`, `## Experience` and `## Architecture` before writing. Routes and flows must match the API surface already named.

2. Explore the existing codebase to understand what structure already exists:
   - **Routing**: Next.js `app/` or `pages/` directory, React Router config, Vue Router, SvelteKit routes, or static HTML page files
   - **Navigation components**: header, sidebar, navbar, breadcrumb, footer components
   - **Layout components**: root layouts, nested layouts, page wrappers, container components
   - **Page directories**: how pages are currently organized in the file system
   - **URL patterns**: existing slugs, dynamic segments, query parameter conventions
   - **CMS or data layer**: content models, API routes, data fetching patterns, MDX/content directories
   - If structure exists, this skill extends and improves it. Do not propose a new architecture that ignores what is already built.

3. Interview the user about structural decisions. For each question, provide your recommended answer.

   Cover at minimum:
   - What are the primary things a user needs to find or do? Rank by frequency.
   - How many levels of navigation depth are acceptable?
   - What content will grow over time vs. what is fixed?
   - Are there distinct user types who need different entry points?
   - What is the one page/view where the user spends 80% of their time?

4. Once you have a shared understanding, fill the `## Structure` section of the design file discovered in step 1, under the name it already has.

## What to write in `## Structure`

**Write what this feature adds.** A feature on an existing site does not need a site map of the whole site, a glossary of every term, or a content growth plan — it needs the routes it introduces, the flows it changes, and which existing layouts it reuses. A new product needs more; write the extra sub-headings then, and only then.

Do not restate interactions already named in `## Experience`. Reference them.

```markdown
## Structure

**Routes**: every page or view this feature adds or changes, with its URL pattern. Nest with indentation where the hierarchy matters.

- Settings `/settings`
  - Profile `/settings/profile`

**Navigation**: where these hang off what already exists — primary nav, a sidebar, a menu item, nothing at all. For a new product: primary / secondary / utility / mobile, and the maximum item count for each.

**Flows**: the critical paths, as numbered steps with the decision points marked.

1. User lands on `/settings`
2. User edits display name and saves
   - valid → saved, inline confirmation
   - empty → inline error under the field, nothing written

**Component reuse**: which existing layouts, containers and navigation elements this reuses, and any behavior differences. This is what stops the build reimplementing a shell that already exists.

**Content priority** (per page, when a page has enough on it to need ordering): what comes first, second, third, and why.

**URL rules** (only when this feature introduces a pattern): dynamic segments, query parameters for filtering / sorting / pagination.

**Naming**: the terms the UI uses for this feature's concepts, when a concept has more than one plausible label. One word, used everywhere.
```

## Done when

- `## Structure` in `.design/YYYY-MM-DD-<slug>.md` is filled, or says in one line why there is nothing structural here
- Routes, navigation placement, and the primary user flows are all named
- The flows match the endpoints in `## Architecture` where there are any
- Nothing restates what `## Experience` already said, and nothing is a placeholder

**Then hand off.** Say: "Structure written to `.design/YYYY-MM-DD-<slug>.md`." Then: "Next: **`/atelier:design-tokens`** to derive the visual system, or skip it if this project already has one."
