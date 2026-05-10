---
name: design-tokens
description: Produce a `DESIGN_TOKENS.md` spec — colors (light + dark), spacing, typography, layout, motion, breakpoints — derived from a chosen aesthetic philosophy. Output is a markdown document (name / value / semantic role) saved to `.design/<slug>/`, NOT an actual CSS or Tailwind config file. Materialization into the project's real token file happens later in `/build` (or when `frontend-design` runs standalone). Use when starting a new project, establishing a visual system, setting up tokens, or the user mentions "tokens" or "design system".
---

This skill produces the design tokens **spec** for a project. Run it after the design brief and before building any components. It writes a markdown document (`DESIGN_TOKENS.md`) inside `.design/<slug>/` — not a CSS or Tailwind file. The build phase materializes the spec into the project's stack-appropriate format.

## Example prompts

- "Set up design tokens for this project"
- "Generate a token spec based on Dieter Rams"
- "I need a spacing scale and color palette before I start building"
- "Create tokens that match our brief"

## Process

1. **Check what already exists.** Scan the codebase for:
   - CSS variable definitions (`:root`, `[data-theme]`, custom property files)
   - Tailwind config (`tailwind.config.js|ts`) — especially `theme.extend`
   - Theme provider files (Material UI `createTheme`, Chakra `extendTheme`, shadcn `globals.css`)
   - Design token JSON files (Style Dictionary format, Figma token exports)
   - Any `tokens.css`, `variables.css`, `theme.css`, etc.
   - `package.json` UI framework dependencies (tailwindcss, @mui/material, @chakra-ui/react, etc.)

   If tokens already exist, **extend the spec to cover gaps** (missing dark mode, incomplete spacing scale, no motion tokens) rather than replacing.

2. **Read the brief.** Look for `.design/<slug>/DESIGN_BRIEF.md`. If multiple slugs exist, use the most recently modified one or ask. If the brief names a philosophy, derive token values from it. If no brief exists, ask the user what direction they want.

3. **Write `DESIGN_TOKENS.md`** into the same `.design/<slug>/` folder as the brief. Use the output shape below. Every token gets a name, a value, and a semantic role — the role is what tells the builder *why* this token exists, so it isn't renamed away.

4. **Note the intended stack.** In a "Materialization notes" section, name the project's stack (Tailwind, CSS, CSS-in-JS) and where the materialized file should live. `/build` uses this to translate the spec into real code.

## Output shape

`DESIGN_TOKENS.md` follows this structure. Skip categories the brief doesn't need (e.g. no motion tokens for a print-heavy layout — but say so explicitly).

```markdown
# Design Tokens

Philosophy: [named philosophy, e.g. "Dieter Rams"]
Base grid: [4px / 8px]
Derived from: `DESIGN_BRIEF.md`

## Color — Light

| Token                        | Value        | Role                                         |
| ---------------------------- | ------------ | -------------------------------------------- |
| `color-bg-primary`           | `#FFFFFF`    | Main background                              |
| `color-bg-secondary`         | `#F5F5F5`    | Cards, surfaces raised above the base        |
| `color-bg-tertiary`          | `#EAEAEA`    | Inputs, wells, subtle depressions            |
| `color-bg-inverse`           | `#111111`    | Inverted panels                              |
| `color-text-primary`         | `#111111`    | Body text                                    |
| `color-text-secondary`       | `#555555`    | Subdued text, captions                       |
| `color-text-tertiary`        | `#999999`    | Placeholder, disabled                        |
| `color-text-inverse`         | `#FFFFFF`    | Text on inverse backgrounds                  |
| `color-text-link`            | `#0057FF`    | Links                                        |
| `color-border-primary`       | `#DDDDDD`    | Default borders                              |
| `color-border-secondary`     | `#EEEEEE`    | Subtle borders (dividers)                    |
| `color-border-focus`         | `#0057FF`    | Focus ring                                   |
| `color-accent-primary`       | `#0057FF`    | Primary actions                              |
| `color-accent-primary-hover` | `#0044CC`    | Primary hover                                |
| `color-accent-primary-active`| `#003399`    | Primary active                               |
| `color-status-success`       | `#0A8A3E`    | Success feedback                             |
| `color-status-warning`       | `#B4761E`    | Warning feedback                             |
| `color-status-error`         | `#C4292A`    | Error feedback                               |
| `color-status-info`          | `#1E6BB4`    | Info feedback                                |
| `color-surface-overlay`      | `rgba(0,0,0,0.4)` | Modal/dropdown backdrop                 |

## Color — Dark

| Token                        | Value        | Role                                         |
| ---------------------------- | ------------ | -------------------------------------------- |
| `color-bg-primary`           | `#0A0A0A`    | Main background                              |
| `color-text-primary`         | `#E5E5E5`    | Body text                                    |
| ... (mirror the light table) |              |                                              |

Notes: dark palette is not a raw inversion — [describe how it was tuned for the philosophy].

## Spacing

Base grid: [4px / 8px]. Rationale: [why this base fits the philosophy].

| Token       | Value  | Role                          |
| ----------- | ------ | ----------------------------- |
| `space-0`   | `0`    |                               |
| `space-1`   | `4px`  | Micro gaps                    |
| `space-2`   | `8px`  |                               |
| `space-3`   | `12px` |                               |
| `space-4`   | `16px` | Base rhythm                   |
| `space-5`   | `24px` |                               |
| `space-6`   | `32px` |                               |
| `space-7`   | `48px` | Section spacing               |
| `space-8`   | `64px` |                               |
| `space-9`   | `96px` |                               |
| `space-10`  | `128px`|                               |

## Typography

| Token                  | Value                                    | Role                     |
| ---------------------- | ---------------------------------------- | ------------------------ |
| `font-family-display`  | `'Suisse Intl', sans-serif`              | Headlines                |
| `font-family-body`     | `'Suisse Intl', sans-serif`              | Body copy                |
| `font-family-mono`     | `'JetBrains Mono', monospace`            | Code                     |
| `font-size-xs`         | `12px`                                   | Caption                  |
| `font-size-sm`         | `14px`                                   | Small text               |
| `font-size-base`       | `16px`                                   | Body                     |
| ... etc                |                                          |                          |
| `font-weight-normal`   | `400`                                    |                          |
| `font-weight-medium`   | `500`                                    |                          |
| `font-weight-bold`     | `700`                                    |                          |
| `line-height-tight`    | `1.2`                                    | Headings                 |
| `line-height-normal`   | `1.5`                                    | Body                     |
| `line-height-relaxed`  | `1.7`                                    | Long-form reading        |
| `letter-spacing-tight` | `-0.02em`                                | Display type             |
| `letter-spacing-normal`| `0`                                      |                          |
| `letter-spacing-wide`  | `0.08em`                                 | Small caps / labels      |

## Layout

| Token                | Value      | Role                                    |
| -------------------- | ---------- | --------------------------------------- |
| `max-width-content`  | `65ch`     | Comfortable reading width               |
| `max-width-wide`     | `1024px`   | Wide content area                       |
| `max-width-page`     | `1280px`   | Page maximum                            |
| `border-radius-sm`   | `2px`      |                                         |
| `border-radius-md`   | `6px`      |                                         |
| `border-radius-lg`   | `12px`     |                                         |
| `border-radius-full` | `9999px`   | Pill / circle                           |
| `shadow-sm`          | `0 1px 2px rgba(0,0,0,0.04)` |                       |
| `shadow-md`          | `0 4px 12px rgba(0,0,0,0.08)` |                      |
| `shadow-lg`          | `0 12px 32px rgba(0,0,0,0.12)` |                     |
| `shadow-focus`       | `0 0 0 3px rgba(0,87,255,0.3)` |                     |

## Motion

| Token               | Value                              | Role                     |
| ------------------- | ---------------------------------- | ------------------------ |
| `duration-instant`  | `50ms`                             | Micro-interactions       |
| `duration-fast`     | `150ms`                            | Hover, focus             |
| `duration-normal`   | `250ms`                            | Default                  |
| `duration-slow`     | `400ms`                            | Content reveals          |
| `duration-slower`   | `600ms`                            | Slow, cinematic          |
| `easing-default`    | `cubic-bezier(0.4, 0, 0.2, 1)`     | Standard                 |
| `easing-in`         | `cubic-bezier(0.4, 0, 1, 1)`       | Enter                    |
| `easing-out`        | `cubic-bezier(0, 0, 0.2, 1)`       | Exit                     |
| `easing-bounce`     | `cubic-bezier(0.34, 1.56, 0.64, 1)`| Playful                  |

## Breakpoints

| Token           | Value    | Role                    |
| --------------- | -------- | ----------------------- |
| `breakpoint-sm` | `375px`  | Mobile                  |
| `breakpoint-md` | `768px`  | Tablet                  |
| `breakpoint-lg` | `1024px` | Small desktop           |
| `breakpoint-xl` | `1280px` | Desktop                 |
| `breakpoint-2xl`| `1536px` | Wide desktop            |

## Materialization notes

- **Stack detected**: [e.g. "Tailwind CSS 3.x + Next.js"]
- **Target files**:
  - Extend `tailwind.config.ts` under `theme.extend` for colors, spacing, fontFamily, fontSize, borderRadius, boxShadow, transitionDuration, transitionTimingFunction, screens.
  - Write CSS variables to `app/globals.css` under `:root` and `[data-theme="dark"]` for anything that needs runtime theming (typically colors).
- **Dark mode strategy**: `[data-theme="dark"]` attribute + `prefers-color-scheme` media query fallback.
- **Do not** duplicate values between Tailwind config and CSS variables — Tailwind can reference the CSS var directly (e.g. `colors: { 'bg-primary': 'var(--color-bg-primary)' }`).
```

## Guidance for filling the spec

### Color
- Use semantic tokens, not raw values (`color-bg-primary`, not `color-white`). Semantic tokens survive palette changes.
- Both light and dark palettes should feel intentional for the chosen philosophy, not one inverted from the other.
- Reduce contrast slightly in dark mode (pure white text on pure black is harsh).

### Spacing
- Tight philosophies (Brutalist, Swiss): 4px base.
- Balanced philosophies (Rams, Scandinavian): 4px or 8px base.
- Spacious philosophies (Japanese Ma, Editorial): 8px base, larger multipliers.

### Typography
- Choose distinctive fonts (Google Fonts / self-hosted). Avoid generic defaults (Inter, Roboto, Arial) unless the philosophy demands them.
- Pair a display font with a body font when the philosophy calls for contrast.

### Motion
- Match durations to the philosophy: Brutalist wants near-instant or none; Japanese Ma wants slow and gentle; Neo-Memphis wants bouncy.

### Dark mode
- Warm-charcoal for Scandinavian, cool slate for Swiss, near-black for Brutalist.
- Shadows: darker and more transparent — never the same values as light mode.
- Accent colors may need lightness adjustments to hit WCAG contrast against dark backgrounds.

## Output

Write to `.design/<slug>/DESIGN_TOKENS.md`. State the philosophy the tokens derive from and note any deviations or judgment calls at the top of the file. Do **not** write a `tokens.css`, `tailwind.config.js`, or `theme.ts` — that's `/build`'s job.
