---
name: ui-build
description: Build a feature's frontend from its `.design/YYYY-MM-DD-<slug>.md` — `## Tasks` against `## Experience`, `## Structure` and the tokens — guided by a named aesthetic philosophy, never generic AI styling. The frontend phase of `/atelier:build`. Use when implementing UI from an atelier design file, or building components, pages or screens in a project that has one.
---

This skill guides creation of distinctive, production-grade frontend interfaces. Implement real working code with exceptional attention to aesthetic detail.

## Example prompts

- "Build the hero section from the brief"
- "Create a card component in a Scandinavian style"
- "I want this to feel like a Japanese magazine. Build the layout."
- "Build the settings page. Use whatever style fits."

## Before You Write Any Code

0. **Materialize a token spec if one exists but no token file does.** Find the feature's design file by the procedure in `${CLAUDE_SKILL_DIR}/../design/SKILL.md` → **Finding the design file**. If its `### Tokens` block (under `## Experience`; a top-level `## Tokens` in older files) names new tokens AND the project has no existing token file (no `tokens.css`, no populated `theme.extend`, no `theme.ts` populated from a prior pass), translate the spec into the project's stack-appropriate format first:
   - Tailwind project → extend `tailwind.config.js|ts` under `theme.extend` AND write CSS variables to `globals.css` for anything that needs runtime theming.
   - Plain CSS/HTML → write to `tokens.css`, imported by the root stylesheet.
   - CSS-in-JS (Material UI / Chakra / Emotion) → write to `theme.ts` in the expected shape for the library.
   - Default when unclear → CSS custom properties in `tokens.css`.

   Read names, values, and roles directly from the spec — do not re-derive from the philosophy. Announce the file created before proceeding. (When invoked from `/build`, the orchestrator will have already flagged this step; still perform it if the file isn't there yet.)

1. **Explore the existing codebase first.** Scan specifically for:
   - **Component directories**: `components/`, `ui/`, `shared/` and list every component by name and its props/API
   - **CSS variables / tokens**: files named `tokens.css`, `variables.css`, `theme.css`, or `:root` declarations with custom properties
   - **Tailwind config**: `tailwind.config.js` or `tailwind.config.ts`, check `theme.extend` for custom values
   - **UI framework themes**: Material UI `createTheme`, Chakra `extendTheme`, shadcn `globals.css` and `components.json`
   - **Storybook**: `.storybook/` directory or `*.stories.*` files indicating documented components
   - **Font loading**: Google Fonts links, `@font-face` declarations, font imports
   - **Layout patterns**: how existing pages handle grid, containers, breakpoints, and spacing
   - **Package.json UI dependencies**: tailwindcss, @mui/material, @chakra-ui/react, @radix-ui, lucide-react, framer-motion, etc.
   - If components exist that match or partially match what you need to build, extend or compose them. Do not create duplicates.

2. **Understand the context:**
   - What problem does this interface solve? Who uses it?
   - What is the intended emotional tone?
   - What are the hard constraints (framework, devices, performance, accessibility)?

3. **Commit to an aesthetic direction.** Either the user names one (see [Aesthetic Philosophies](#aesthetic-philosophies)) or you choose one that fits the context. State your choice and why before writing code.

## Aesthetic Philosophies

When the user names a philosophy or describes a vibe, read its entry in [references/philosophies.md](references/philosophies.md) and build from it: Dieter Rams, Swiss / International Typographic, Japanese Minimalism (Ma), Brutalist, Scandinavian, Art Deco, Neo-Memphis, Editorial / Magazine. Each entry fixes typography, color, layout, spacing, motion and details — concrete enough to implement, not a mood board.

## Implementation Guidelines

- **Typography**: Choose distinctive fonts loaded via Google Fonts or CDN. Avoid generic defaults (Inter, Roboto, Arial, system fonts). Pair a display font with a body font.
- **Color**: Use CSS variables for consistency. Dominant color with sharp accents outperforms safe, evenly-distributed palettes.
- **Motion**: CSS transitions for HTML. Framer Motion / Motion library for React. Focus on high-impact moments (page load reveals, state changes) over scattered micro-interactions.
- **Spatial composition**: Unexpected layouts earn attention. Asymmetry, overlap, diagonal flow, grid-breaking elements. Or, if the philosophy demands it, strict grids executed with precision.
- **Backgrounds and depth**: Create atmosphere. Gradient meshes, noise textures, geometric patterns, layered transparencies, grain overlays. Match the chosen philosophy.

NEVER produce generic AI aesthetics: purple gradients on white, Inter font, predictable card grids, cookie-cutter component layouts. Every output should feel designed for its specific context.

Match implementation complexity to the aesthetic vision. A Dieter Rams interface is 50 lines of precise CSS. A Neo-Memphis interface is 300 lines of creative chaos. Both are correct.

## Mobile-First

Build mobile layout first, then scale up. This is non-negotiable.

- Start with a single-column layout at 375px width.
- Add complexity at each breakpoint (`min-width` media queries, not `max-width`).
- Touch targets must be at least 44x44px on mobile.
- Body text must be at least 16px on mobile (prevents iOS zoom on input focus).
- Navigation must have a mobile-specific pattern (hamburger, bottom tabs, or drawer). Do not rely on horizontal nav bars that overflow.
- Test that line lengths stay comfortable (45-75 characters) at every breakpoint.

## Dark Mode

If a design tokens file exists (from `/design-tokens`), use its dark mode palette. If not, generate dark mode support alongside the light theme.

- Use CSS custom properties so switching themes means changing variable values, not rewriting components.
- Support both `prefers-color-scheme` media query (system preference) and a `[data-theme="dark"]` attribute (manual toggle).
- Do not simply invert colors. Dark backgrounds should be warm or cool to match the philosophy (warm charcoal for Scandinavian, cool slate for Swiss, near-black for Brutalist).
- Reduce pure white text to off-white (e.g., `#E5E5E5` or `rgba(255,255,255,0.87)`) to reduce eye strain.
- Shadows in dark mode should be darker and more transparent, not the same values as light mode.
- Accent colors may need lightness adjustments to maintain WCAG contrast ratios against dark backgrounds.
- Include a `prefers-reduced-motion` media query for users who need it. Disable or simplify all animations and transitions within that query.

## Error States

Error states are part of the design, not an afterthought bolted on when something breaks. The backend (see `errors`) hands you a body of `{ ref, message, trace_id }` — `message` is written for humans and is safe to render verbatim.

- **Render `message` as-is.** Do not rewrite it in the component, do not prefix it with "Error:", do not fall back to `err.message` or `"Request failed with status code 500"`. Those are the internal half, and the user should never see them.
- **Never invent copy for a failure you did not model.** If the response has no `message`, one line — "Something went wrong on our end. Try again in a moment." — plus the `ref` and `trace_id`.
- **Show `ref` and `trace_id`, quietly.** Small, muted, selectable, near the message. That is what the user screenshots into a support ticket. Copy-to-clipboard on the pair is a two-line affordance that saves support a round trip.
- **Give the user the next action.** Retry, go back, contact support. An error state that only states the problem makes the user's next move guesswork.
- **Style it like the rest of the design.** The error state follows the same philosophy, tokens, and type scale as everything else. A default red browser-looking box in a Scandinavian interface is a broken seam.
- **Validation errors go inline, next to the field.** A form-wide banner for a single bad email makes the user hunt for it.

## Done when

- Every frontend task in `## Tasks` is implemented and ticked
- `## Implementation` records what each task produced: the files, and any decision the diff cannot explain
- Tests cover the cases named in `## Tests`, and nothing its "Not testing" list ruled out
- The token file is materialized if the spec called for it
- Every failure path renders the server's user-facing message plus `ref` and `trace_id` — no raw exceptions, no invented copy
- Tests for the new behavior pass, or you said which did not and why
- Comments follow `keep-it-simple` rule 4 — none by default, none historical, and the ratio kept low enough that the ones left still read as signal

**Then hand off.** Say: "Frontend done: N files, tests green." Then: "Next: **`/atelier:backend-build`** if `## Architecture` names server work, otherwise **`/atelier:review`**."
